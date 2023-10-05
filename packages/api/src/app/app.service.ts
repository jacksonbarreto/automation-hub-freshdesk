
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import { createReadStream, mkdirSync, unlinkSync, appendFileSync, writeFileSync, readFileSync } from 'fs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TICKET_STATUS_ENUM } from '../enums/freshdesk-ticket-status';
import { IFreshDeskTicket } from '../interfaces/freshdesk-ticket';
import { IFreshDeskTicketDetial } from '../interfaces/freshdesk-ticket-detail';
import { WAIT } from '../helpers';
import { EventsGateway } from './events.gateway';
import { google } from 'googleapis';

const BASE_PATH = 'dist/packages/invoices';
const BASE_PATH_LOGS = 'dist/packages/logs';

@Injectable()
export class AppService {

	BACKGROUND_JOB_ENABLED = false;

	constructor(private eventEmitter: EventEmitter2, private eventsGateway: EventsGateway) { }


	public get BACKGROUND_JOB(): boolean {
		return this.BACKGROUND_JOB_ENABLED;
	}


	public set BACKGROUND_JOB(jobState: boolean) {
		this.BACKGROUND_JOB_ENABLED = jobState;
	}


	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	public runBackgroundJob(): void {
		if (this.BACKGROUND_JOB_ENABLED)
			this.startSyncing();
	}

	public startSyncing(): void {
		try {
			mkdirSync(BASE_PATH_LOGS);
		}
		// eslint-disable-next-line no-empty
		catch (e) { }

		try {
			mkdirSync(BASE_PATH);
		}
		// eslint-disable-next-line no-empty
		catch (e) { }

		this.eventEmitter.emit('processData');
	}

	public writeLogIntoFileAndEmitEvent(eventName: string, data: { title: string, description: string }): void {
		this.eventsGateway.server.emit(eventName, data);

		try {
			appendFileSync(
				`${BASE_PATH_LOGS}/${this.formatDateToDDMMYYYY(new Date())}.txt`,
				`\n${new Date()} \n${eventName} \ntitle: ${data.title} \n${data.description} \n\n`
			);
		}
		catch (e) {
			this.eventsGateway.server.emit('error', { title: 'error', description: 'cannot append in the log file' });
		};
	}

	public addWordToFilteredWordsList(word: string): void {
		const words = this.wordsList();
		const updatedWords = [word, ...words];

		try {
			writeFileSync('words.txt', updatedWords.join('\n'), 'utf-8');
		}
		catch (e) {
			this.eventsGateway.server.emit('error', { title: 'error', description: 'cannot create word in the list' });
		}
	}

	public deleteWordFromList(wordToRemove: string): void {
		const words = this.wordsList();
		const updatedWords = words.filter(word => word !== wordToRemove);

		try {
			writeFileSync('words.txt', updatedWords.join('\n'), 'utf-8');
		}
		catch (e) {
			this.eventsGateway.server.emit('error', { title: 'error', description: 'cannot create word in the list' });
		}
	}

	public wordsList(): string[] {
		const filteredWords = readFileSync('words.txt', 'utf-8').toLowerCase().split('\n');

		return filteredWords.length ? filteredWords.filter(item => item !== '') : [];
	}

	@OnEvent('processData')
	public async processData(): Promise<void> {
		const ticketsProcessed = {};

		try {
			await WAIT(2000);

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Progress', description: 'Started work!' }
			);

			let ticketsLength = 0;
			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { results: ticketResults, total } = await this.getOpenTicketsFromFreshDesk(1);

				if (!ticketResults.length || (ticketsLength === ticketResults.length)) { // so that the open tickets are not checked again and again
					break;
				}

				ticketsLength = ticketResults.length;

				await WAIT(2000);

				this.writeLogIntoFileAndEmitEvent(
					'updates',
					{ title: 'Progress', description: 'Fetched data of tickets! ' + `Total ${total} tickets.` }
				);


				await WAIT(2000);

				this.writeLogIntoFileAndEmitEvent(
					'updates',
					{ title: 'Progress', description: `Details of ${ticketResults.length} tickets fetched!` }
				);

				await WAIT(2000);

				for (let index = 0; index < ticketResults.length; index++) {
					const ticket = ticketResults[index];

					if (!ticketsProcessed[ticket.id]) {
						ticketsProcessed[ticket.id] = true;

						this.writeLogIntoFileAndEmitEvent(
							'updates',
							{ title: 'Progress', description: `${index + 1} of ${ticketResults.length} is processing!` }
						);

						await this.processTicket(ticket);
					}

				}
			}

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Success', description: `Every ticket has been processed!` }
			);

			this.eventsGateway.server.emit('processComplete');
		}
		catch (e) {
			console.log(e);

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Failed', description: `Some of the tickets have been processed. Server error failure! Try again after some time or contact system administrator.` }
			);
		};
	}

	private async processTicket(ticket: IFreshDeskTicket): Promise<void> {
		const ticketDetail = await this.getTicketDetailsFromFreshDesk(ticket.id);

		const { reason, result } = this.isTicketTypeRecieptOrInvoice(this.wordsList(), ticketDetail);

		if (result) {
			this.eventsGateway.server.emit('normalTicket', { reason, ticketDetail });

			const filename = `${ticketDetail.id}-description.pdf`;
			const path = `${BASE_PATH}`;
			const filenameWithPath = `${path}/${filename}`;

			await this.generatePdfFromHtml(ticketDetail.description, filenameWithPath);

			await WAIT(2000);

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Progress', description: `file created on server. ${filename} ` }
			);

			await this.uploadFileFromPathToGoogleDrive(filenameWithPath, filename);

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Progress', description: `file uploaded on google drive. ${filename} ` }
			);

			if (ticketDetail.attachments.length) {
				await WAIT(2000);

				this.writeLogIntoFileAndEmitEvent(
					'updates',
					{ title: 'Progress', description: `${ticketDetail.id} has ${ticketDetail.attachments.length} attachments.` }
				);

				await WAIT(2000);

				for (let attachmentIndex = 0; attachmentIndex < ticketDetail.attachments.length; attachmentIndex++) {
					const { attachment_url, name } = ticketDetail.attachments[attachmentIndex];
					const attachmentName = `${ticketDetail.id}-attachment-${attachmentIndex + 1}.pdf`;
					const attachmentNameWithPath = `${path}/${attachmentName}`;

					if (name.indexOf('.pdf') > -1) {
						const attachmentData = await this.downloadPDFFromUrl(attachment_url);
						writeFileSync(attachmentNameWithPath, attachmentData);

						await WAIT(2000);

						this.writeLogIntoFileAndEmitEvent(
							'updates',
							{ title: 'Progress', description: `uploading ticket attachment to google drive  ${attachmentName}` }
						);

						await this.uploadFileFromPathToGoogleDrive(attachmentNameWithPath, attachmentName);
					}
				}
				await WAIT(2000);
			}

			await WAIT(2000);

			await this.updateStatusOfTicketInFreshDesk(ticketDetail.id, TICKET_STATUS_ENUM.Closed);

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Success', description: `Ticket ${ticketDetail.id} is processed. The status has been changed to 'Closed'!` }
			);

			await WAIT(2000);

			unlinkSync(filenameWithPath);
		}
		else {
			this.eventsGateway.server.emit('flaggedTicket', { reason, ticketDetail });

			this.writeLogIntoFileAndEmitEvent(
				'updates',
				{ title: 'Progress', description: `Ticket ${ticketDetail.id} is flagged. Skipping upload and moving to next!` }
			);

			await WAIT(2000);
		}
	}

	private async uploadFileFromPathToGoogleDrive(path: string, title: string): Promise<string> {
		const auth = new google.auth.GoogleAuth({
			keyFile: 'google-key.json',
			scopes: ['https://www.googleapis.com/auth/drive'],
		});

		const drive = google.drive({
			version: 'v2',
			auth
		});

		const media = {
			mimeType: 'application/pdf',
			body: createReadStream(path),
		};

		const response = await drive.files.insert({
			media,
			requestBody: {
				title,
				parents: [{ id: process.env.GOOGLE_DRIVE_FOLDER_ID }]
			}
		});

		return response.data.id;
	}

	private async getOpenTicketsFromFreshDesk(page: number): Promise<{ results: IFreshDeskTicket[], total: number }> {
		try {
			const response = await axios.get(`${process.env.FRESHDESK_API_URL}/v2/search/tickets`, {
				headers: {
					Authorization: `Basic ${Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString('base64')}`,
				},
				params: {
					query: `"status:${TICKET_STATUS_ENUM.Pending} OR status:${TICKET_STATUS_ENUM.Open}"`,
					page
				}
			});

			return response.data;

		} catch (error) {
			throw new Error(`Failed to fetch tickets: ${error.message}`);
		}
	}

	private async getTicketDetailsFromFreshDesk(ticketId: number): Promise<IFreshDeskTicketDetial> {
		try {
			const response = await axios.get(`${process.env.FRESHDESK_API_URL}/v2/tickets/${ticketId}`, {
				headers: {
					Authorization: `Basic ${Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString('base64')}`,
				}
			});

			return response.data;

		} catch (error) {
			throw new Error(`Failed to fetch ticket detail: ${error.message}`);
		}
	}

	private isTicketTypeRecieptOrInvoice(filteringContent: string[], ticket: IFreshDeskTicketDetial): { reason: string, result: boolean } {

		const attachmentReason = ticket.attachments.length > 0 ?
			`This ticket has ${ticket.attachments.length} attachments. All are uploaded.` :
			`This ticket has 0 attachments.`
			;

		for (let i = 0; i < filteringContent.length; i++) {
			const whitelistedWord = filteringContent[i];

			if (whitelistedWord.length) {
				if (ticket.subject.toLocaleLowerCase().indexOf(whitelistedWord.toLocaleLowerCase()) > -1)
					return { result: true, reason: `'${whitelistedWord}' word found in ticket's subject. ${attachmentReason}` }

				if (ticket.description.toLocaleLowerCase().indexOf(whitelistedWord.toLocaleLowerCase()) > -1)
					return { result: true, reason: `'${whitelistedWord}' word found in ticket's description. ${attachmentReason}` }

				if (ticket.description_text.toLocaleLowerCase().indexOf(whitelistedWord.toLocaleLowerCase()) > -1)
					return { result: true, reason: `'${whitelistedWord}' word found in ticket's description text. ${attachmentReason}` }
			}
		}

		return {
			reason: `Could not find any word from list in Ticket ${ticket.id} subject and its description. This ticket has ${ticket.attachments.length} attachments. ${ticket.attachments.length > 0 ? 'None of them uploaded.' : ''}`,
			result: false
		};
	}

	private async updateStatusOfTicketInFreshDesk(ticketId: number, status: TICKET_STATUS_ENUM): Promise<IFreshDeskTicketDetial> {
		try {
			const response = await axios.put(`${process.env.FRESHDESK_API_URL}/v2/tickets/${ticketId}`,
				{
					status
				},
				{
					headers: {
						Authorization: `Basic ${Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString('base64')}`,
					},

				}
			);

			return response.data;

		} catch (error) {
			throw new Error(`Failed to update status of ticket ${ticketId} : ${error.message}`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private async downloadPDFFromUrl(url: string): Promise<any> {
		try {
			const response = await axios.get(url, { responseType: 'arraybuffer' });

			return response.data;
		} catch (error) {
			throw new Error('Error downloading PDF from the external URL.');
		}
	}

	private async generatePdfFromHtml(html: string, toPath: string): Promise<void> {
		const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
		const page = await browser.newPage();

		await page.setContent(html, { waitUntil: 'networkidle0' });
		await page.pdf({ path: toPath });

		await browser.close();
	}

	private formatDateToDDMMYYYY(date: Date): string {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
		const year = date.getFullYear();

		return `${day}-${month}-${year}`;
	}
}
