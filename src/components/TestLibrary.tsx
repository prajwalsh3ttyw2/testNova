import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { testStorage } from '@/lib/test-storage';
import { SavedTest, TestStep, Project } from '@/types/recorder';
import {
  Search,
  Plus,
  Play,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  Filter,
  Clock,
  Globe,
  Code2,
  Tag,
  Archive,
  CheckCircle,
  FileText,
  MoreHorizontal,
  Eye,
  Settings,
  FolderOpen,
  Star,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TestLibraryProps {
  onLoadTest: (test: SavedTest) => void;
  currentTest?: SavedTest | null;
  currentProject: Project;
  onBackToProjects: () => void;
}

export function TestLibrary({ onLoadTest, currentTest, currentProject, onBackToProjects }: TestLibraryProps) {
  const [tests, setTests] = useState<SavedTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<SavedTest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Partial<SavedTest>>({});

  useEffect(() => {
    loadTests();
  }, [currentProject.id]);

  const loadTests = () => {
    const projectTests = testStorage.getTestsByProject(currentProject.id);
    setTests(projectTests.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.url.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || test.testType === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSaveTest = () => {
    if (!editingTest.name?.trim()) return;

    const testToSave: SavedTest = {
      id: editingTest.id || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: editingTest.name.trim(),
      description: editingTest.description || '',
      url: editingTest.url || '',
      steps: editingTest.steps || [],
      events: editingTest.events || [],
      createdAt: editingTest.createdAt || Date.now(),
      updatedAt: Date.now(),
      tags: editingTest.tags || [],
      testType: editingTest.testType || 'Functional',
      projectId: currentProject.id
    };

    testStorage.saveTest(testToSave);
    loadTests();
    setIsEditDialogOpen(false);
    setEditingTest({});
  };

  const handleDeleteTest = (testId: string) => {
    testStorage.deleteTest(testId);
    loadTests();
  };

  const handleDuplicateTest = (testId: string) => {
    const duplicated = testStorage.duplicateTest(testId);
    if (duplicated) {
      loadTests();
    }
  };

  const handleEditTest = (test: SavedTest) => {
    setEditingTest(test);
    setIsEditDialogOpen(true);
  };

  const handleViewTest = (test: SavedTest) => {
    setSelectedTest(test);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: SavedTest['testType']) => {
    switch (status) {
      case 'Monkey':
        return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800';
      case 'Functional':
        return 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800';
      default:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800';
    }
  };

  // const getStatusIcon = (status: SavedTest['testType']) => {
  //   switch (status) {
  //     case 'ready':
  //       return <Monkey className="h-3 w-3" />;
  //     case 'archived':
  //       return <Archive className="h-3 w-3" />;
  //     default:
  //       return <FileText className="h-3 w-3" />;
  //   }
  // };

  const exportTests = () => {
    const data = testStorage.exportProject(currentProject.id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}-tests-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTests = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = testStorage.importProject(content);
      if (result.success) {
        loadTests();
      }
      alert(result.message);
    };
    reader.readAsText(file);
  };

  const stats = testStorage.getProjectStats(currentProject.id);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToProjects}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Projects
            </Button>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${currentProject.color || 'bg-blue-500'} flex items-center justify-center text-white text-xs font-semibold`}>
                {currentProject.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{currentProject.name}</h2>
                <p className="text-xs text-muted-foreground">Test Library</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTest({ projectId: currentProject.id });
                setIsEditDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Test
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportTests}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Tests
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="flex items-center cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Tests
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTests}
                      className="hidden"
                    />
                  </label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-primary">{stats.totalTests}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-green-600">{stats.readyTests}</div>
            <div className="text-xs text-muted-foreground">Ready</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-yellow-600">{stats.draftTests}</div>
            <div className="text-xs text-muted-foreground">Draft</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-blue-600">{stats.totalSteps}</div>
            <div className="text-xs text-muted-foreground">Steps</div>
          </div>
        </div> */}

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Monkey">Monkey</SelectItem>
              <SelectItem value="Functional">Functional</SelectItem>

            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Test List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No tests found</p>
              <p className="text-xs">Create your first test to get started</p>
            </div>
          ) : (
            filteredTests.map((test) => (
              <Card
                key={test.id}
                className={`hover:bg-accent/50 transition-colors cursor-pointer ${currentTest?.id === test.id ? 'ring-2 ring-primary' : ''
                  }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                        {test.name}
                        {/* {currentTest?.id === test.id && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )} */}
                      </CardTitle>
                      {test.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {test.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onLoadTest(test)}>
                          <Play className="h-4 w-4 mr-2" />
                          Load Test
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewTest(test)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTest(test)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTest(test.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Test</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{test.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTest(test.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span className="truncate max-w-24">{test.url || 'No URL'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Code2 className="h-3 w-3" />
                        <span>{test.steps.length} steps</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(test.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(test.testType)}`}>

                        <span className="ml-1 capitalize">{test.testType}</span>
                      </Badge>
                      {test.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {test.tags.slice(0, 2).join(', ')}
                            {test.tags.length > 2 && '...'}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadTest(test)}
                      className="h-6 px-2 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Load
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {editingTest.id ? 'Edit Test' : 'Create New Test'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-name">Test Name *</Label>
                <Input
                  id="test-name"
                  value={editingTest.name || ''}
                  onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                  placeholder="Enter test name"
                />
              </div>
              <div>
                <Label htmlFor="test-status">Test type *</Label>
                <Select
                  value={editingTest.testType || 'Monkey'}
                  onValueChange={(value) => setEditingTest({ ...editingTest, testType: value as SavedTest['testType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monkey">Monkey</SelectItem>
                    <SelectItem value="Functional">Functional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="test-url">URL *</Label>
              <Input
                id="test-url"
                value={editingTest.url || ''}
                onChange={(e) => setEditingTest({ ...editingTest, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="test-description">Description for AI generation *</Label>
              <Textarea
                id="test-description"
                value={editingTest.description || ''}
                onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                placeholder="Describe what this test does..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="test-tags">Tags (comma separated)</Label>
              <Input
                id="test-tags"
                value={editingTest.tags?.join(', ') || ''}
                onChange={(e) => setEditingTest({
                  ...editingTest,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="login, smoke, regression"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTest} disabled={!editingTest.name?.trim() || !editingTest.description || editingTest?.status}>
                {editingTest.id ? 'Update Test' : 'Create Test'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedTest?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline" className={`mt-1 ${getStatusColor(selectedTest.testType)}`}>
                      {/* {getStatusIcon(selectedTest.testType)} */}
                      <span className="ml-1 capitalize">{selectedTest.testType}</span>
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">URL</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedTest.url || 'No URL'}</p>
                  </div>
                </div>

                {selectedTest.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedTest.description}</p>
                  </div>
                )}

                {selectedTest.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTest.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Test Steps ({selectedTest.steps.length})</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTest.steps.map((step, index) => (
                      <Card key={step.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.description}</p>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              <code>{step.code}</code>
                            </pre>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="mt-1">{new Date(selectedTest.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="mt-1">{new Date(selectedTest.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}