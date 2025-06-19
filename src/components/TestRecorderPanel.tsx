import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProjectLibrary } from '@/components/ProjectLibrary';
import { TestLibrary } from '@/components/TestLibrary';
import { testRecorder } from '@/lib/test-recorder';
import { testStorage } from '@/lib/test-storage';
import { RecordedEvent, TestStep, SavedTest, Project } from '@/types/recorder';
import { INJECT_SCRIPT } from '@/lib/inject-script';
import { usePanelStore } from '@/lib/store';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Square,
  Code2,
  Copy,
  Globe,
  Bug,
  ChevronRight,
  MousePointer2,
  Keyboard,
  FileEdit,
  ExternalLink,
  Clock,
  List,
  TestTube2,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  LoaderIcon ,
  Zap,
  Activity,
  Settings,
  Eye,
  RotateCcw,
  Save,
  FolderOpen,
  BookOpen,
  Folder,
  TestTubeDiagonal,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
      };
    };
  }
}

interface TimelineEvent {
  id: string;
  type: 'navigation' | 'click' | 'input' | 'change';
  title: string;
  timestamp: number;
  details?: Record<string, any>;
  icon: JSX.Element;
}

export function TestRecorderPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState<SavedTest | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [showTestTabs, setShowTestTabs] = useState(false);
  const [result, setResult] = useState("");
  const [isGenerateLoading, setisGenerateLoading] = useState(false);


  const webviewRef = useRef<HTMLWebViewElement>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // First API mutation
  const initProcessMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('http://172.18.104.22:5001/api/TestNova/initprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Init process failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Init process successful:', data);
    },
    onError: (error) => {
      console.error('Init process failed:', error);
    },
  });

  // Second API mutation
  const generateFeatureMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('http://172.18.104.22:5001/api/TestNova/generatefeature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Generate feature failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Generate feature successful:', data);
    },
    onError: (error) => {
      console.error('Generate feature failed:', error);
    },
    
  });

const sequentialMutation = useMutation({
    mutationFn: async () => {
    const recordedEventsList=timelineEvents.map((recEvent=>`${recEvent.type} in ${recEvent.details?.placeholder} in ${recEvent?.details?.xpath}`))
      const initData = {
        requirements: currentTest?.description,
        activities: [{
          pageUrl: url,
          action: recordedEventsList
        }]
      };
setisGenerateLoading(true);
      const initResult = await initProcessMutation.mutateAsync(initData);
      
    
      const generateData = {
        fileId: initResult.result || "default-file-id",
        testingType:1 ,
        userPrompt: ''
      };

      const generateResult = await generateFeatureMutation.mutateAsync(generateData);
      
      setResult(generateResult.result);
      return { initResult, generateResult };
    },
    onSuccess: () => {
      toast.success('Scenarios Generated') 
setisGenerateLoading(false);

       setActiveTab('scenarios');
    },
    onError: (error) => {
    setisGenerateLoading(false);

      console.error('Sequential API calls failed:', error);
    },
  });
const handleGenerate = () => {
    sequentialMutation.mutate();
  };



  const {
    isLeftPanelCollapsed,
    setLeftPanelCollapsed,
    leftPanelSize,
    setLeftPanelSize
  } = usePanelStore();

  // Keep track of the last event for deduplication
  const lastEventRef = useRef<{ selector: string; xpath: string; type: string; value: string | null; timestamp: number } | null>(null);

  const injectRecorderScript = () => {
    if (webviewRef.current) {
      console.log('Injecting script into webview');
      webviewRef.current.executeJavaScript(`
        try {
          ${INJECT_SCRIPT}
          // Verify injection
          console.log('Script injection verification');
          document.body.style.border = '2px solid green';
        } catch (error) {
          console.error('Script injection failed:', error);
        }
      `);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'navigation':
        return <ChevronRight className="h-3.5 w-3.5" />;
      case 'click':
        return <MousePointer2 className="h-3.5 w-3.5" />;
      case 'input':
        return <Keyboard className="h-3.5 w-3.5" />;
      case 'change':
        return <FileEdit className="h-3.5 w-3.5" />;
      default:
        return <ExternalLink className="h-3.5 w-3.5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'navigation':
        return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800';
      case 'click':
        return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800';
      case 'input':
        return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-800';
      case 'change':
        return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-800';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const isDuplicateEvent = (event: RecordedEvent) => {
    if (!lastEventRef.current) return false;

    const lastEvent = lastEventRef.current;
    const timeDiff = event.timestamp - lastEvent.timestamp;

    // For input events, only record on blur or after a delay
    if (event.type === 'input') {
      return timeDiff < 1000;
    }

    // For other events, check if it's a duplicate within a short time window
    return (
      lastEvent.selector === event.selector &&
      lastEvent.xpath===event.xpath&&
      lastEvent.type === event.type &&
      lastEvent.value === event.value &&
      timeDiff < 500
    );
  };

  const processEvent = (recordedEvent: RecordedEvent) => {
    // Check for duplicate events
    if (isDuplicateEvent(recordedEvent)) {
      return;
    }

    // Update last event reference
    lastEventRef.current = {
      selector: recordedEvent.selector,
      xpath:recordedEvent.xpath,
      type: recordedEvent.type,
      value: recordedEvent.value,
      timestamp: recordedEvent.timestamp
    };

    // Add event to test recorder
    testRecorder.addEvent(recordedEvent);
    const newSteps = testRecorder.generateTest();
    setSteps(newSteps);

    // Add event to timeline with unique ID
    const newEvent: TimelineEvent = {
      id: `event-${recordedEvent.timestamp}-${Math.random()}`,
      type: recordedEvent.type as TimelineEvent['type'],
      title: getEventTitle(recordedEvent),
      timestamp: recordedEvent.timestamp,
      details: recordedEvent,
      icon: getEventIcon(recordedEvent.type)
    };
    console.log(recordedEvent);
    setTimelineEvents(prev => {
      // Keep only unique events based on ID
      const uniqueEvents = [newEvent, ...prev].filter((event, index, self) =>
        index === self.findIndex((e) => e.id === event.id)
      );
      // Sort by timestamp in descending order (most recent first)
      return uniqueEvents.sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  useEffect(() => {
    const handleWebviewLoad = () => {
      setIsLoading(false);
      // Add navigation event to timeline
      const navigationEvent: TimelineEvent = {
        id: `nav-${Date.now()}`,
        type: 'navigation',
        title: `Navigated to ${webviewRef.current?.src}`,
        timestamp: Date.now(),
        icon: getEventIcon('navigation')
      };
      setTimelineEvents(prev => [navigationEvent, ...prev]);
      setTimeout(injectRecorderScript, 1000);
    };

    const handleConsoleMessage = (e: { message: string }) => {
      try {
        const data = JSON.parse(e.message);
        if (data.type === 'RECORDED_EVENT' && isRecording) {
          const recordedEvent = data.event as RecordedEvent;

          // Handle input events with debouncing
          if (recordedEvent.type === 'input') {
            if (inputTimeoutRef.current) {
              clearTimeout(inputTimeoutRef.current);
            }
            inputTimeoutRef.current = setTimeout(() => {
              processEvent(recordedEvent);
            }, 1000);
            return;
          }

          // Process other events immediately
          processEvent(recordedEvent);
        }
      } catch (error) {
        // Ignore non-JSON console messages
      }
    };

    if (webviewRef.current) {
      webviewRef.current.addEventListener('dom-ready', handleWebviewLoad);
      webviewRef.current.addEventListener('console-message', handleConsoleMessage);
      webviewRef.current.addEventListener('did-fail-load', (e) => {
        console.error('Webview failed to load:', e);
        setIsLoading(false);
      });
      webviewRef.current.addEventListener('did-start-loading', () => {
        setIsLoading(true);
      });
      webviewRef.current.addEventListener('did-stop-loading', () => {
        setIsLoading(false);
      });
    }

    return () => {
      if (webviewRef.current) {
        webviewRef.current.removeEventListener('dom-ready', handleWebviewLoad);
        webviewRef.current.removeEventListener('console-message', handleConsoleMessage);
      }
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, [isRecording]);

  const getEventTitle = (event: RecordedEvent): string => {
    switch (event.type) {
      case 'click':
        return `Clicked ${event.text ? `"${event.text}"` : event.tagName}`;
      case 'input':
        return `Typed in ${event.tagName}`;
      case 'change':
        return `Changed ${event.tagName}`;
      default:
        return `${event.tagName} interaction`;
    }
  };

  const handleStartRecording = () => {
    console.log('Starting recording');
    testRecorder.clearEvents();
    setTimelineEvents([]);
    lastEventRef.current = null;
    setIsRecording(true);
    injectRecorderScript();
    toast.success('Recording started');
  };

  const handleStopRecording = () => {
    console.log('Stopping recording');
    setIsRecording(false);
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    toast.success('Recording stopped');
  };

  const handleClearRecording = () => {
    console.log('Clearing recording');
    testRecorder.clearEvents();
    setSteps([]);
    setTimelineEvents([]);
    lastEventRef.current = null;
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    toast.success('Recording cleared');
  };

  const handleSaveTest = () => {
    if (steps.length === 0) {
      toast.error('No steps to save');
      return;
    }

    if (!currentProject) {
      toast.error('Please select a project first');
      return;
    }

    const testName = prompt('Enter test name:');
    if (!testName?.trim()) return;

    const savedTest: SavedTest = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: testName.trim(),
      description: '',
      url: url,
      steps: steps,
      events: testRecorder.getEvents(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      // status: 'draft',
      projectId: currentProject.id
    };

    testStorage.saveTest(savedTest);
    setCurrentTest(savedTest);
    toast.success(`Test "${testName}" saved successfully`);
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setActiveTab('library');
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
    setActiveTab('projects');
    setShowTestTabs(false);
    setCurrentTest(null);
  };

  const handleLoadTest = (test: SavedTest) => {
    setCurrentTest(test);
    setUrl(test.url);
    setSteps(test.steps);

    // Recreate timeline events from test events
    const events: TimelineEvent[] = test.events.map((event, index) => ({
      id: `loaded-event-${index}`,
      type: event.type as TimelineEvent['type'],
      title: getEventTitle(event),
      timestamp: event.timestamp,
      details: event,
      icon: getEventIcon(event.type)
    }));

    setTimelineEvents(events.sort((a, b) => b.timestamp - a.timestamp));

    // Load events into test recorder
    testRecorder.clearEvents();
    test.events.forEach(event => testRecorder.addEvent(event));

    // Show test tabs and switch to timeline
    setShowTestTabs(true);
    setActiveTab('timeline');

    toast.success(`Test "${test.name}" loaded`);

    // Navigate to the test URL
    if (test.url && webviewRef.current) {
      const formattedUrl = test.url.startsWith('http') ? test.url : `https://${test.url}`;
      setIsLoading(true);
      webviewRef.current.src = formattedUrl;
    }
  };

  const handleBackToLibrary = () => {
    setShowTestTabs(false);
    setActiveTab('library');
    setCurrentTest(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const navigateWebview = () => {
    if (webviewRef.current) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      console.log('Navigating to:', formattedUrl);
      setIsLoading(true);
      webviewRef.current.src = formattedUrl;
    }
  };

  const toggleDevTools = () => {
    window.electron?.ipcRenderer.send('toggle-dev-tools');
  };

  const handlePanelResize = (sizes: number[]) => {
    if (!isLeftPanelCollapsed) {
      setLeftPanelSize(sizes[0]);
    }
  };

  const toggleLeftPanel = () => {
    setLeftPanelCollapsed(!isLeftPanelCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      <PanelGroup direction="horizontal" onLayout={handlePanelResize}>
        <Panel
          defaultSize={isLeftPanelCollapsed ? 0 : leftPanelSize}
          collapsible
          collapsedSize={0}
          minSize={20}
          maxSize={70}
          collapsed={isLeftPanelCollapsed}
          onCollapse={setLeftPanelCollapsed}
          onExpand={() => setLeftPanelCollapsed(false)}
          className="transition-all duration-300 ease-in-out"
        >
          {/* Left Panel - Test Recorder */}
          <div className="h-full flex flex-col border-r bg-card/50 backdrop-blur-sm">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLeftPanel}
                    className="shrink-0 h-8 w-8"
                  >
                    {isLeftPanelCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </Button>
                  {!isLeftPanelCollapsed && (
                    <>
                      <div className="flex items-center">
                         <h1 className="text-lg font-semibold">testNova </h1>
                     <TestTubeDiagonal className="mt-[11px]" /> <Sparkles />
                      </div>
                      <Badge variant={isRecording ? "destructive" : "secondary"} className="ml-2">
                        {isRecording ? (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 animate-pulse" />
                            Recording
                          </div>
                        ) : (
                          'Idle'
                        )}
                      </Badge>
                    </>
                  )}
                </div>
                {!isLeftPanelCollapsed && (
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button onClick={toggleDevTools} variant="ghost" size="icon" className="h-8 w-8">
                      <Bug className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>


            </div>

            {!isLeftPanelCollapsed && (
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  {<TabsList className="w-full justify-start border-b rounded-none p-0 h-10 bg-transparent">
                    {/* <TabsTrigger
                      value="projects"
                      className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10"
                    >
                      <Folder className="h-3.5 w-3.5" />
                      Projects
                    </TabsTrigger> */}
                    {currentProject && (
                      <TabsTrigger
                        value="library"
                        className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Library
                      </TabsTrigger>
                    )}
                    {showTestTabs && (
                      <>
                        <TabsTrigger
                          value="timeline"
                          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Timeline
                        </TabsTrigger>
                        <TabsTrigger
                          value="scenarios"
                          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10"
                        >
                          <List className="h-3.5 w-3.5" />
                          Scenarios
                        </TabsTrigger>
                        {/* <TabsTrigger
                          value="test"
                          className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10"
                        >
                          <TestTube2 className="h-3.5 w-3.5" />
                          Code
                        </TabsTrigger> */}
                      </>
                    )}
                  </TabsList>}
                  {!isLeftPanelCollapsed && (
                    <>
                      {/* <Separator /> */}
                      <div className="p-2 space-y-3">
                        {/* Current Project & Test Info */}
                        {currentProject && (
                          <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${currentProject.color || 'bg-blue-500'} flex items-center justify-center text-white text-xs font-semibold`}>
                                  {currentProject.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium truncate">{currentProject.name}</span>
                              </div>
                              {currentTest && (
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3 w-3 text-primary" />
                                  <span className="text-xs font-medium truncate">{currentTest.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recording Controls - Only show when test is loaded or recording */}
                        {(showTestTabs || isRecording) && (
                          <div className="flex gap-2">
                            {!isRecording ? (
                              <Button
                                onClick={handleStartRecording}
                                variant="default"
                                disabled={isLoading}
                                size="sm"
                                className="flex-1"
                              >
                               
                                <Play className="mr-2 h-4 w-4" />
                                Start Recording
                                {isLoading && <LoaderIcon className="animate-spin ml-2" />}
                              </Button>
                            ) : (
                              <Button
                                onClick={handleStopRecording}
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Stop Recording
                              </Button>
                            )}
                            <Button
                              onClick={handleClearRecording}
                              variant="outline"
                              size="sm"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleSaveTest}
                              variant="outline"
                              size="sm"
                              disabled={steps.length === 0 || !currentProject}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleGenerate}
                              variant="default"
                              disabled={steps.length === 0 || !currentProject || isLoading||isGenerateLoading}

                            >
                             
 
                             {isGenerateLoading ?<> Generating <LoaderIcon className="animate-spin ml-2 h-4 w-4" /></> : <> Generate <Sparkles className="ml-2 h-4 w-4" /></>}

                            </Button>
                          </div>
                        )}

                        {/* URL Navigation - Only show when test is loaded */}
                        {showTestTabs && (
                          <div className="flex gap-2">
                            <Input
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              placeholder="Enter URL to test"
                              className="flex-1 h-8"
                              onKeyDown={(e) => e.key === 'Enter' && navigateWebview()}
                            />
                            <Button
                              onClick={navigateWebview}
                              variant="secondary"
                              disabled={isLoading}
                              size="sm"
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Stats - Only show when test is loaded */}
                        {showTestTabs && (
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timelineEvents.length} events
                            </div>
                            <div className="flex items-center gap-1">
                              <List className="h-3 w-3" />
                              {steps.length} steps
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <TabsContent value="projects" className="flex-1 m-0 overflow-hidden">
                    <ProjectLibrary onSelectProject={handleSelectProject} />
                  </TabsContent>

                  {currentProject && (
                    <TabsContent value="library" className="flex-1 m-0 overflow-hidden">
                      <TestLibrary
                        onLoadTest={handleLoadTest}
                        currentTest={currentTest}
                        currentProject={currentProject}
                        onBackToProjects={handleBackToProjects}
                      />
                    </TabsContent>
                  )}

                  {showTestTabs && (
                    <>
                      <TabsContent value="timeline" className="flex-1 p-3 m-0 overflow-hidden">
                        <ScrollArea className="h-full">
                          <div className="space-y-3">
                            {timelineEvents.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <Clock className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No events recorded yet</p>
                                <p className="text-xs">Start recording to see timeline</p>
                              </div>
                            ) : (
                              timelineEvents.map((event, index) => (
                                <div
                                  key={event.id}
                                  className="relative group"
                                >
                                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (event.details) {
                                        setSelectedEvent(event);
                                        setIsDetailsOpen(true);
                                      }
                                    }}
                                  >
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${getEventColor(event.type)}`}>
                                      {event.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                        <p className="font-medium text-sm truncate">{event.title}</p>
                                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                          {new Date(event.timestamp).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {event.type}
                                      </Badge>
                                    </div>
                                    {event.details && (
                                      <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                  </div>
                                  {index !== timelineEvents.length - 1 && (
                                    <div className="absolute left-7 top-14 bottom-0 w-[1px] bg-border" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="scenarios" className="flex-1 p-3 m-0 overflow-hidden">
                        <ScrollArea className="h-full">
                          <div className="space-y-3">
                            {result.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <List className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No Tests generated yet</p>
                                <p className="text-xs">Record interactions and generate to see tests</p>
                              </div>
                            ) : (
                               <pre className="text-xs p-2 bg-muted rounded overflow-x-auto">
                                  {result}
                                  </pre>
                              // steps.map((step, index) => (
                              //   <Card key={step.id} className="p-3 hover:bg-accent/50 transition-colors">
                              //     <div className="flex justify-between items-start mb-2">
                              //       <div className="flex items-center gap-2">
                              //         <Badge variant="outline" className="text-xs">
                              //           {index + 1}
                              //         </Badge>
                              //         <h3 className="font-medium text-sm">{step.description}</h3>
                              //       </div>
                              //       <Button
                              //         variant="ghost"
                              //         size="icon"
                              //         onClick={() => copyToClipboard(step.code)}
                              //         className="h-6 w-6"
                              //       >
                              //         <Copy className="h-3 w-3" />
                              //       </Button>
                              //     </div>
                              //     <pre className="text-xs p-2 bg-muted rounded overflow-x-auto">
                              //       <code>{step.code}</code>
                              //     </pre>
                              //   </Card>
                              
                              // ))
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      {/* <TabsContent value="test" className="flex-1 p-3 m-0 overflow-hidden">
                        <ScrollArea className="h-full">
                          {steps.length > 0 ? (
                            <Card className="p-3">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium flex items-center text-sm">
                                  <Code2 className="mr-2 h-4 w-4" />
                                  Generated Test
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(steps.map(s => s.code).join('\n'))}
                                  className="h-6 w-6"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="text-xs p-3 bg-muted rounded overflow-x-auto">
                                <code>
                                  {`describe('Generated Test', () => {
  it('performs recorded actions', () => {
${steps.map(s => '    ' + s.code).join('\n')}
  })
})`}
                                </code>
                              </pre>
                            </Card>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                              <TestTube2 className="h-8 w-8 mb-2 opacity-50" />
                              <p className="text-sm">No test code generated yet</p>
                              <p className="text-xs">Record steps to generate test code</p>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent> */}
                    </>
                  )}
                </Tabs>
              </div>
            )}
          </div>
        </Panel>

        {!isLeftPanelCollapsed && (
          <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-all duration-200 group">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </PanelResizeHandle>
        )}

        {/* Right Panel - Browser View */}
        <Panel>
          <div className="h-full relative">
            {isLeftPanelCollapsed && (
              <div className="absolute top-4 left-4 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleLeftPanel}
                  className="bg-background/80 backdrop-blur-sm shadow-lg border-border/50 hover:bg-accent/80 transition-all duration-200"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </div>
            )}
            <webview
              ref={webviewRef}
              src="about:blank"
              className="w-full h-full"
              webpreferences="allowtransparency=true,nodeIntegration=false, contextIsolation=false, webSecurity=false, allowRunningInsecureContent=true"
              // partition="persist:mypartition"
            />
          </div>
        </Panel>
      </PanelGroup>

      {/* Event Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent?.details && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Type:</span> {selectedEvent.details.type}</p>
                    <p><span className="font-medium">Element:</span> {selectedEvent.details.tagName}</p>
                    <p><span className="font-medium">Timestamp:</span> {new Date(selectedEvent.details.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Element Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {/* <p><span className="font-medium">Selector:</span> <code className="text-xs bg-muted px-1 rounded">{selectedEvent.details.selector}</code></p> */}
                    <p><span className="font-medium text-wrap whitespace-break-spaces">Xpath:</span> <code className="text-xs bg-muted px-1 rounded  break-all whitespace-pre-wrap">{selectedEvent.details.xpath}</code></p>

                    {selectedEvent.details.value && (
                      <p><span className="font-medium">Value:</span> {selectedEvent.details.value}</p>
                    )}
                    {selectedEvent.details.text && (
                      <p><span className="font-medium">Text Content:</span> {selectedEvent.details.text}</p>
                    )}
                  </div>
                </div>
              </div>
              {selectedEvent.details.context && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Context Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Context Type:</span> {selectedEvent.details.context.type}</p>
                    <p><span className="font-medium">Source:</span> {selectedEvent.details.context.src}</p>
                    <p><span className="font-medium">Context Selector:</span> <code className="text-xs bg-muted px-1 rounded">{selectedEvent.details.context.selector}</code></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
// http://172.18.104.22:5001//api/TestNova/initprocess



// {
//   "requirements": "",
//   "activities": [
//     {
//       "pageUrl": "",
//       "action": [
//         {action} in {tagName} in {xpath},

 
//       ]
//     }
//   ]
