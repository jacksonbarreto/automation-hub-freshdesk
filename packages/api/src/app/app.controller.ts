import { Body, Controller, HttpStatus, Post, Res, Get } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {

  constructor(private readonly appService: AppService) { }

  @Post('start')
  public start(@Body() { password }: { password: string }, @Res() res: Response): void {

    if (password && password === process.env.PASSWORD) {
      this.appService.startSyncing();

      res.status(HttpStatus.OK).json([]);

      return;
    }

    res.status(HttpStatus.UNAUTHORIZED).json([]);
  }


  @Get('works')
  public works(): string {
    return 'server is up!'
  }

  @Get('background-job')
  public getBackgroundJobState(): { state: boolean } {
    return {
      state: this.appService.BACKGROUND_JOB
    };
  }

  @Get('filtered-words')
  public wordsList(): string[] {
    return this.appService.wordsList();
  }

  @Post('background-job')
  public setBackgroundJobState(@Body() { state }: { state: boolean }): void {
    this.appService.BACKGROUND_JOB = state;
  }

  @Post('remove-word')
  public deleteWordFromWordsList(@Body() { word }: { word: string }): void {
    this.appService.deleteWordFromList(word);
  }

  @Post('add-word')
  public addWordToWordsList(@Body() { word }: { word: string }): void {
    this.appService.addWordToFilteredWordsList(word);
  }
}
