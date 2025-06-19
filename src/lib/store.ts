import { create } from 'zustand';

interface PanelState {
  isLeftPanelCollapsed: boolean;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  leftPanelSize: number;
  setLeftPanelSize: (size: number) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  isLeftPanelCollapsed: false,
  setLeftPanelCollapsed: (collapsed) => set({ isLeftPanelCollapsed: collapsed }),
  leftPanelSize: 50,
  setLeftPanelSize: (size) => set({ leftPanelSize: size }),
}));