import { EventType, RecordedEvent, TestStep } from '@/types/recorder';

class TestRecorder {
  private events: RecordedEvent[] = [];

  public addEvent(event: RecordedEvent) {
    console.log('Adding event:', JSON.stringify(event, null, 2));
    this.events.push(event);
  }

  public clearEvents() {
    this.events = [];
  }

  public getEvents(): RecordedEvent[] {
    return [...this.events];
  }

  public generateTest(): TestStep[] {
    return this.events.map((event, index) => ({
      id: `step-${index + 1}`,
      description: this.generateStepDescription(event),
      code: this.generateTestCode(event),
      event,
    }));
  }

  private generateStepDescription(event: RecordedEvent): string {
    const elementDesc = event.text 
      ? `"${event.text}"` 
      : event.value 
        ? `with value "${event.value}"` 
        : `${event.tagName} element`;
    
    const contextDesc = event.context
      ? ` within iframe "${event.context.src}"`
      : '';

    switch (event.type) {
      case EventType.Click:
        return `Click ${elementDesc} at "${event.selector}"${contextDesc}`;
      case EventType.Input:
        return `Type "${event.value}" into ${event.tagName} at "${event.selector}"${contextDesc}`;
      case EventType.Change:
        return `Change value to "${event.value}" in ${event.tagName} at "${event.selector}"${contextDesc}`;
      case EventType.Submit:
        return `Submit form at "${event.selector}"${contextDesc}`;
      default:
        return `Interact with ${elementDesc} at "${event.selector}"${contextDesc}`;
    }
  }

  private generateTestCode(event: RecordedEvent): string {
    const selector = event.selector;
    const iframeContext = event.context ? `cy.iframe('${event.context.selector}').` : 'cy.';
    
    switch (event.type) {
      case EventType.Click:
        return `${iframeContext}get('${selector}').click();`;
      case EventType.Input:
        return `${iframeContext}get('${selector}').type('${event.value}');`;
      case EventType.Change:
        if (event.tagName === 'select') {
          return `${iframeContext}get('${selector}').select('${event.value}');`;
        }
        return `${iframeContext}get('${selector}').type('${event.value}');`;
      case EventType.Submit:
        return `${iframeContext}get('${selector}').submit();`;
      default:
        return `// Unhandled event type: ${event.type}`;
    }
  }
}

export const testRecorder = new TestRecorder();