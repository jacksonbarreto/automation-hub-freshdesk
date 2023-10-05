/* eslint-disable @typescript-eslint/no-explicit-any */

import { Layout, Card, Button, notification, Row, Col, Input, message, Alert } from 'antd';
import { ChangeEvent, useEffect, useState } from 'react';
import SocketService from '../services/socket.service';
import { FETCH_DATA } from '../services/api.service';
import { BackgroundJobChange } from './background-job-change';
import { FilteredWords } from './words';

const { Content } = Layout;

export function App() {
	const [api, contextHolder] = notification.useNotification();
	const [messageApi, contextHolderMessage] = message.useMessage();
	const socket = SocketService.getSocket();
	const [buttonDisabled, setButtonDisabled] = useState(false);
	const [password, setPassword] = useState('');
	const [flaggedTickets, setFlaggedTickets] = useState<{ ticketDetail: Record<string, any>, reason: string }[]>([]);
	const [normalTickets, setNormalTickets] = useState<{ ticketDetail: Record<string, any>, reason: string }[]>([]);

	const [sync, setSync] = useState(false);


	useEffect(() => {
		socket.on('updates', (data) => {
			api.open({
				message: data.title,
				description: data.description,
				duration: 5
			});
		});

		socket.on('processComplete', () => {
			messageApi.open({
				type: 'success',
				content: 'Process of all tickets complete!',
				duration: 5,
			});
			setButtonDisabled(false);
		});

		socket.on('flaggedTicket', (detail: { ticketDetail: Record<string, any>, reason: string }) => {

			if (flaggedTickets.find(({ ticketDetail }) => detail.ticketDetail.id === ticketDetail.id))
				return;

			setFlaggedTickets(details => ([...details, detail]));
		});

		socket.on('normalTicket', (detail: { ticketDetail: Record<string, any>, reason: string }) => {
			if (normalTickets.find(({ ticketDetail }) => detail.ticketDetail.id === ticketDetail.id))
				return;

			setNormalTickets(details => ([...details, detail]));
		});

		socket.on('disconnect', () => {
			messageApi.open({
				type: 'error',
				content: 'Connection with Server disconnected',
				duration: 5
			});
		});

		socket.on('connect', () => {
			messageApi.open({
				type: 'success',
				content: 'Connection to server established!',
				duration: 3
			});
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const startSyncing = async () => {
		setSync(true);
		setButtonDisabled(true);

		setFlaggedTickets([]);
		setNormalTickets([]);

		await FETCH_DATA(password).catch(
			(error) => {
				if (error?.response?.status === 401)
					messageApi.open({
						type: 'error',
						content: 'Password incorrect. Try again!',
						duration: 5
					});
				else
					messageApi.open({
						type: 'error',
						content: 'Server not responding. Try again after 2 minutes or contact system admin!',
						duration: 5
					});

				setButtonDisabled(false);
			}
		);

		setSync(false);
	};

	const renderTicket = (ticket: any) => {
		return (
			<Card title={'Subject: ' + ticket?.subject || ''} style={{ marginTop: 10, overflow: 'auto' }}>
				<div dangerouslySetInnerHTML={{ __html: ticket?.description || '' }} ></div>
			</Card>
		);
	}

	const setPasswordChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		setPassword(event.target.value);
	}

	return (
		<Layout style={{ backgroundColor: '#ece9eb' }}>
			{contextHolder}
			{contextHolderMessage}
			<Card style={{ margin: '10px 50px 0px 50px' }}>
				<h1 style={{ margin: 0 }}>FreshDesk Automation App</h1>
			</Card>
			<Content style={{ padding: 50 }}>
				<Content>
				</Content>
				<Content style={{ display: 'flex' }}>
					<Card title='Freshdesk Task scheduler' style={{ width: 300, height: 200 }}>
						<Input placeholder='Password' type='password' onChange={setPasswordChangeHandler} />
						<Button style={{ marginTop: 20 }} type='primary' size='large' onClick={startSyncing} disabled={!password || buttonDisabled}>
							Start Syncing
						</Button>
					</Card>

					<FilteredWords sync={sync} />

					<div style={{ marginLeft: 100, width: 300 }}>
						<BackgroundJobChange />
					</div>
				</Content>
				<Content style={{ marginTop: 50 }}>
					<Row gutter={50}>
						<Col span={12}>
							<Card
								title={<Alert message={<h3 style={{ margin: 0 }}>Normal tickets uploaded to Drive</h3>} type='success' />}
								style={{ width: '100%' }}>
								{
									normalTickets.map(
										({ reason, ticketDetail }, index) =>
											<Row key={index} style={{ padding: 10 }}>
												<div>
													<h2>{index + 1}. Ticket ID: {ticketDetail?.id}</h2>
													<Alert message={`Reason: ${reason}`} type='success' showIcon />
												</div>
												{renderTicket(ticketDetail)}
											</Row>
									)
								}
							</Card>
						</Col>
						<Col span={12}>
							<Card
								title={<Alert message={<h3 style={{ margin: 0 }}>Flagged tickets not uploaded to Drive</h3>} type='info' />}
								style={{ width: '100%' }}>
								{
									flaggedTickets.map(
										({ reason, ticketDetail }, index) =>
											<Row key={index} style={{ padding: 10, borderBottom: '1px black solid' }}>
												<div>
													<h2>{index + 1}. Ticket ID: {ticketDetail?.id}</h2>
													<Alert message={`Reason: ${reason}`} type='info' showIcon />
												</div>
												{renderTicket(ticketDetail)}
											</Row>
									)
								}
							</Card>
						</Col>
					</Row>

				</Content>
			</Content>
		</Layout >
	);
}

export default App;
