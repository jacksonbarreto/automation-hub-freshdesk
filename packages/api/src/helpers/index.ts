export async function WAIT(delayInMilliseconds: number): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, delayInMilliseconds));
}