import { SavedTest, TestCollection, Project } from '@/types/recorder';

const STORAGE_KEYS = {
  TESTS: 'test-recorder-tests',
  COLLECTIONS: 'test-recorder-collections',
  PROJECTS: 'test-recorder-projects',
  SETTINGS: 'test-recorder-settings'
};

class TestStorage {
  // Project CRUD operations
  saveProject(project: Project): void {
    const projects = this.getAllProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = { ...project, updatedAt: Date.now() };
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  getAllProjects(): Project[] {
    try {
      const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return projects ? JSON.parse(projects) : [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  getProject(id: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  deleteProject(id: string): void {
    // Delete all tests and collections in this project first
    const tests = this.getAllTests().filter(t => t.projectId !== id);
    const collections = this.getAllCollections().filter(c => c.projectId !== id);
    
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    
    // Delete the project
    const projects = this.getAllProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));
  }

  duplicateProject(id: string): Project | null {
    const originalProject = this.getProject(id);
    if (!originalProject) return null;

    const duplicatedProject: Project = {
      ...originalProject,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalProject.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.saveProject(duplicatedProject);
    return duplicatedProject;
  }

  // Test CRUD operations
  saveTest(test: SavedTest): void {
    const tests = this.getAllTests();
    const existingIndex = tests.findIndex(t => t.id === test.id);
    
    if (existingIndex >= 0) {
      tests[existingIndex] = { ...test, updatedAt: Date.now() };
    } else {
      tests.push(test);
    }
    
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  }

  getAllTests(): SavedTest[] {
    try {
      const tests = localStorage.getItem(STORAGE_KEYS.TESTS);
      return tests ? JSON.parse(tests) : [];
    } catch (error) {
      console.error('Error loading tests:', error);
      return [];
    }
  }

  getTestsByProject(projectId: string): SavedTest[] {
    const tests = this.getAllTests();
    return tests.filter(test => test.projectId === projectId);
  }

  getTest(id: string): SavedTest | null {
    const tests = this.getAllTests();
    return tests.find(t => t.id === id) || null;
  }

  deleteTest(id: string): void {
    const tests = this.getAllTests();
    const filteredTests = tests.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(filteredTests));
  }

  duplicateTest(id: string): SavedTest | null {
    const originalTest = this.getTest(id);
    if (!originalTest) return null;

    const duplicatedTest: SavedTest = {
      ...originalTest,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalTest.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.saveTest(duplicatedTest);
    return duplicatedTest;
  }

  // Collection CRUD operations
  saveCollection(collection: TestCollection): void {
    const collections = this.getAllCollections();
    const existingIndex = collections.findIndex(c => c.id === collection.id);
    
    if (existingIndex >= 0) {
      collections[existingIndex] = { ...collection, updatedAt: Date.now() };
    } else {
      collections.push(collection);
    }
    
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  }

  getAllCollections(): TestCollection[] {
    try {
      const collections = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      return collections ? JSON.parse(collections) : [];
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  }

  getCollectionsByProject(projectId: string): TestCollection[] {
    const collections = this.getAllCollections();
    return collections.filter(collection => collection.projectId === projectId);
  }

  getCollection(id: string): TestCollection | null {
    const collections = this.getAllCollections();
    return collections.find(c => c.id === id) || null;
  }

  deleteCollection(id: string): void {
    const collections = this.getAllCollections();
    const filteredCollections = collections.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(filteredCollections));
  }

  // Search and filter
  searchProjects(query: string): Project[] {
    const projects = this.getAllProjects();
    const lowercaseQuery = query.toLowerCase();
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery) ||
      project.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  searchTests(query: string, projectId?: string): SavedTest[] {
    const tests = projectId ? this.getTestsByProject(projectId) : this.getAllTests();
    const lowercaseQuery = query.toLowerCase();
    
    return tests.filter(test => 
      test.name.toLowerCase().includes(lowercaseQuery) ||
      test.description.toLowerCase().includes(lowercaseQuery) ||
      test.url.toLowerCase().includes(lowercaseQuery) ||
      test.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTestsByStatus(status: SavedTest['status'], projectId?: string): SavedTest[] {
    const tests = projectId ? this.getTestsByProject(projectId) : this.getAllTests();
    return tests.filter(test => test.status === status);
  }

  getTestsByTag(tag: string, projectId?: string): SavedTest[] {
    const tests = projectId ? this.getTestsByProject(projectId) : this.getAllTests();
    return tests.filter(test => test.tags.includes(tag));
  }

  getProjectsByStatus(status: Project['status']): Project[] {
    const projects = this.getAllProjects();
    return projects.filter(project => project.status === status);
  }

  // Export/Import
  exportProject(projectId: string): string {
    const project = this.getProject(projectId);
    const tests = this.getTestsByProject(projectId);
    const collections = this.getCollectionsByProject(projectId);
    
    const data = {
      project,
      tests,
      collections,
      exportedAt: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  exportAllData(): string {
    const data = {
      projects: this.getAllProjects(),
      tests: this.getAllTests(),
      collections: this.getAllCollections(),
      exportedAt: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  importProject(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.project) {
        this.saveProject(data.project);
      }
      
      if (data.tests && Array.isArray(data.tests)) {
        data.tests.forEach((test: SavedTest) => this.saveTest(test));
      }
      
      if (data.collections && Array.isArray(data.collections)) {
        data.collections.forEach((collection: TestCollection) => this.saveCollection(collection));
      }
      
      return { success: true, message: 'Project imported successfully' };
    } catch (error) {
      return { success: false, message: 'Invalid JSON format' };
    }
  }

  importAllData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.projects && Array.isArray(data.projects)) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
      }
      
      if (data.tests && Array.isArray(data.tests)) {
        localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(data.tests));
      }
      
      if (data.collections && Array.isArray(data.collections)) {
        localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(data.collections));
      }
      
      return { success: true, message: 'All data imported successfully' };
    } catch (error) {
      return { success: false, message: 'Invalid JSON format' };
    }
  }

  // Statistics
  getProjectStats(projectId: string) {
    const tests = this.getTestsByProject(projectId);
    const collections = this.getCollectionsByProject(projectId);
    
    return {
      totalTests: tests.length,
      totalCollections: collections.length,
      draftTests: tests.filter(t => t.status === 'draft').length,
      readyTests: tests.filter(t => t.status === 'ready').length,
      archivedTests: tests.filter(t => t.status === 'archived').length,
      totalSteps: tests.reduce((sum, test) => sum + test.steps.length, 0)
    };
  }

  getGlobalStats() {
    const projects = this.getAllProjects();
    const tests = this.getAllTests();
    const collections = this.getAllCollections();
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      archivedProjects: projects.filter(p => p.status === 'archived').length,
      totalTests: tests.length,
      totalCollections: collections.length,
      draftTests: tests.filter(t => t.status === 'draft').length,
      readyTests: tests.filter(t => t.status === 'ready').length,
      archivedTests: tests.filter(t => t.status === 'archived').length,
      totalSteps: tests.reduce((sum, test) => sum + test.steps.length, 0)
    };
  }
}

export const testStorage = new TestStorage();