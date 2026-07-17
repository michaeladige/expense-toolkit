import { createContext } from "react";

/**
 * A broadcast command that lets a single control (the topbar collapse/expand-all
 * button, or a menu "jump to" that opens one panel) drive the `CollapsibleCard`
 * instances, which otherwise own their own state.
 */
export interface CollapseCommand {
  /** Bumped on each broadcast; 0 means "no command issued yet". */
  n: number;
  /** The collapsed state to apply. */
  collapsed: boolean;
  /** When set, only the card whose `anchorId` matches reacts; otherwise all do. */
  targetId?: string;
}

export const CollapseControlContext = createContext<CollapseCommand>({
  n: 0,
  collapsed: true,
});
