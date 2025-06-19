export enum EventType {
  Click = "click",
  Input = "input",
  Change = "change",
  Submit = "submit",
}

interface IframeContext {
  type: "iframe";
  src: string;
  selector: string;
}

export interface RecordedEvent {
  type: EventType;
  selector: string;
  xpath: string;
  tagName: string;
  timestamp: number;
  value: string | null;
  text: string;
  context: IframeContext | null;
}

export interface TestStep {
  id: string;
  description: string;
  code: string;
  event: RecordedEvent;
}

export interface SavedTest {
  id: string;
  name: string;
  description: string;
  url: string;
  steps: TestStep[];
  events: RecordedEvent[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
  testType: "Monkey" | "Functional";
  projectId: string;
}

export interface TestCollection {
  id: string;
  name: string;
  description: string;
  tests: SavedTest[];
  createdAt: number;
  updatedAt: number;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  status: "active" | "archived";
  color?: string;
}
