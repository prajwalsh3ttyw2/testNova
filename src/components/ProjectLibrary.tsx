import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { testStorage } from '@/lib/test-storage';
import { Project } from '@/types/recorder';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  Filter,
  FolderOpen,
  Settings,
  MoreHorizontal,
  Eye,
  Calendar,
  Tag,
  Archive,
  CheckCircle,
  FileText,
  Folder,
  Activity,
  TestTube2,
  ArrowRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ProjectLibraryProps {
  onSelectProject: (project: Project) => void;
}

const PROJECT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500'
];

export function ProjectLibrary({ onSelectProject }: ProjectLibraryProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = testStorage.getAllProjects();
    setProjects(allProjects.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    // const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch;
  });

  const handleSaveProject = () => {
    if (!editingProject.name?.trim()) return;

    const projectToSave: Project = {
      id: editingProject.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: editingProject.name.trim(),
      description: editingProject.description || '',
      createdAt: editingProject.createdAt || Date.now(),
      updatedAt: Date.now(),
      tags: editingProject.tags || [],
      status: editingProject.status || 'active',
      color: editingProject.color || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
    };

    testStorage.saveProject(projectToSave);
    loadProjects();
    setIsEditDialogOpen(false);
    setEditingProject({});
  };

  const handleDeleteProject = (projectId: string) => {
    testStorage.deleteProject(projectId);
    loadProjects();
  };

  const handleDuplicateProject = (projectId: string) => {
    const duplicated = testStorage.duplicateProject(projectId);
    if (duplicated) {
      loadProjects();
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800';
      case 'archived':
        return 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-800';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />;
      case 'archived':
        return <Archive className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const exportProject = (projectId: string) => {
    const data = testStorage.exportProject(projectId);
    const project = testStorage.getProject(projectId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'project'}-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllProjects = () => {
    const data = testStorage.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-projects-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importProjects = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = testStorage.importAllData(content);
      if (result.success) {
        loadProjects();
      }
      alert(result.message);
    };
    reader.readAsText(file);
  };

  const stats = testStorage.getGlobalStats();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Projects</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingProject({});
                setIsEditDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAllProjects}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Projects
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="flex items-center cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Projects
                    <input
                      type="file"
                      accept=".json"
                      onChange={importProjects}
                      className="hidden"
                    />
                  </label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>

        {/* Global Stats */}
        {/* <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-primary">{stats.totalProjects}</div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-green-600">{stats.totalTests}</div>
            <div className="text-xs text-muted-foreground">Tests</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-blue-600">{stats.activeProjects}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border">
            <div className="text-lg font-semibold text-purple-600">{stats.totalSteps}</div>
            <div className="text-xs text-muted-foreground">Steps</div>
          </div>
        </div> */}

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      {/* Project List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Folder className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No projects found</p>
              <p className="text-xs">Create your first project to get started</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const projectStats = testStorage.getProjectStats(project.id);
              return (
                <Card
                  key={project.id}
                  className="hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => onSelectProject(project)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${project.color || 'bg-blue-500'} flex items-center justify-center text-white font-semibold text-sm`}>
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                            {project.name}
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                          {project.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(project);
                          }}>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Open Project
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewProject(project);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProject(project.id);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            exportProject(project.id);
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
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
                                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{project.name}"? This will also delete all tests and collections within this project. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
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
                          <TestTube2 className="h-3 w-3" />
                          <span>{projectStats.totalTests} tests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span>{projectStats.totalSteps} steps</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1 capitalize">{project.status}</span>
                        </Badge>
                        {project.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {project.tags.slice(0, 2).join(', ')}
                              {project.tags.length > 2 && '...'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="text-green-600">{projectStats.readyTests}</span>
                        <span>/</span>
                        <span className="text-yellow-600">{projectStats.draftTests}</span>
                        <span>/</span>
                        <span className="text-gray-600">{projectStats.archivedTests}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {editingProject.id ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={editingProject.name || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              {/* <div>
                <Label htmlFor="project-status">Status</Label>
                <Select
                  value={editingProject.status || 'active'}
                  onValueChange={(value) => setEditingProject({ ...editingProject, status: value as Project['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>

            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                placeholder="Describe what this project is for..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="project-tags">Tags (comma separated)</Label>
              <Input
                id="project-tags"
                value={editingProject.tags?.join(', ') || ''}
                onChange={(e) => setEditingProject({
                  ...editingProject,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="web, mobile, api, regression"
              />
            </div>

            <div>
              <Label>Project Color</Label>
              <div className="flex gap-2 mt-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg ${color} border-2 ${editingProject.color === color ? 'border-primary' : 'border-transparent'
                      }`}
                    onClick={() => setEditingProject({ ...editingProject, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProject} disabled={!editingProject.name?.trim()}>
                {editingProject.id ? 'Update Project' : 'Create Project'}
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
              {selectedProject?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline" className={`mt-1 ${getStatusColor(selectedProject.status)}`}>
                      {getStatusIcon(selectedProject.status)}
                      <span className="ml-1 capitalize">{selectedProject.status}</span>
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Project Color</Label>
                    <div className={`w-6 h-6 rounded-lg ${selectedProject.color} mt-1`}></div>
                  </div>
                </div>

                {selectedProject.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedProject.description}</p>
                  </div>
                )}

                {selectedProject.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProject.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Project Statistics</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {(() => {
                      const stats = testStorage.getProjectStats(selectedProject.id);
                      return (
                        <>
                          <div className="text-center p-3 bg-card rounded-lg border">
                            <div className="text-lg font-semibold text-primary">{stats.totalTests}</div>
                            <div className="text-xs text-muted-foreground">Total Tests</div>
                          </div>
                          <div className="text-center p-3 bg-card rounded-lg border">
                            <div className="text-lg font-semibold text-green-600">{stats.readyTests}</div>
                            <div className="text-xs text-muted-foreground">Ready Tests</div>
                          </div>
                          <div className="text-center p-3 bg-card rounded-lg border">
                            <div className="text-lg font-semibold text-blue-600">{stats.totalSteps}</div>
                            <div className="text-xs text-muted-foreground">Total Steps</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="mt-1">{new Date(selectedProject.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="mt-1">{new Date(selectedProject.updatedAt).toLocaleString()}</p>
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