export class SwitchableStream {
  private currentStream: ReadableStream | null = null;
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();

  constructor() {
    this.currentStream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
    });
  }

  public get stream(): ReadableStream {
    return this.currentStream!;
  }

  public write(text: string) {
    if (this.controller) {
      this.controller.enqueue(this.encoder.encode(text));
    }
  }

  public close() {
    if (this.controller) {
      this.controller.close();
    }
  }

  public error(error: any) {
    if (this.controller) {
      this.controller.error(error);
    }
  }
}
