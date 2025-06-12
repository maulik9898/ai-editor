## Project Overview

An AI-powered file editor that enables intelligent editing through AI-generated diffs with user approval workflows. The application features a multi-agent system where each agent can be configured with specific tools, capabilities, and settings tailored for different editing contexts and user needs.

## Core Workflow

```
User Query → Agent Selection → Version Checkpoint → AI Analysis → Diff Generation → Chat Preview → User Approval → Selective Application
```

1. User selects or system determines appropriate agent for the task
2. System creates automatic version checkpoint before AI analysis
3. Selected agent receives full file content and request in prompt
4. Agent generates structured diffs using its configured tools
5. Tool renders diff preview in chat UI (returns null to prevent auto-application)
6. User reviews diffs and selectively applies or rejects changes
7. Editor updates with approved modifications
8. Version history maintained with restore points

## Goal State of Application

### Primary Objectives
- **Multi-Agent AI System**: Multiple specialized agents with distinct capabilities and configurations
- **Safe AI Editing**: AI assists with file modifications while user maintains full control
- **Granular Change Management**: Users can review and selectively apply individual changes
- **Version Safety**: Complete version history with easy restoration capabilities
- **Context Adaptability**: System adapts AI tools and behavior based on editing context and selected agent
- **Production Ready**: Enterprise-level reliability, configuration, and user experience

### User Experience Vision
- **Agent Selection**: Users can choose or system auto-selects appropriate agent for each task
- **Conversational Editing**: Natural language requests for file modifications
- **Visual Diff Reviews**: Clear, intuitive diff previews within chat interface
- **Restore Points**: Visual timeline similar to Cline showing version checkpoints
- **Flexible Configuration**: Users can customize agents, AI behavior, prompts, and tools
- **Multi-Context Support**: Same interface works across different file types and use cases

### Technical Goals
- **Agent Management System**: Easy creation, configuration, and management of AI agents
- **Extensible Architecture**: Easy addition of new file types and AI tools
- **Performance**: Smooth editing experience even with large files
- **Reliability**: Robust error handling and graceful degradation
- **Security**: Safe AI operations with validation and sanitization

## Multi-Agent System

### Agent Architecture Philosophy
- **Specialized Agents**: Each agent designed for specific tasks or contexts
- **Configurable Capabilities**: Agents can be equipped with different tool sets
- **Independent Settings**: Each agent maintains its own configuration and behavior patterns
- **User Control**: Users can create, modify, and manage their own agents

### Agent Configuration System
- **Tool Assignment**: Each agent configured with specific set of tools
- **Custom Instructions**: Agent-specific system prompts and behavior guidelines
- **Context Specialization**: Agents optimized for specific file types or editing scenarios
- **Performance Tuning**: Agent-level settings for response time, creativity, precision

### Agent Types (Examples)
- **JSON Editor Agent**: Specialized for JSON manipulation with validation tools
- **Code Refactor Agent**: Focused on code improvement and optimization
- **Documentation Agent**: Optimized for markdown and documentation editing
- **Data Transform Agent**: Specialized in data format conversions and transformations
- **Custom Agents**: User-defined agents for specific workflows

### Agent Management Features
- **Agent Library**: Pre-built agents for common use cases
- **Agent Creation Wizard**: Guided setup for custom agents
- **Agent Sharing**: Export/import agent configurations
- **Agent Analytics**: Performance metrics and usage statistics per agent

## Versioning System

### Version Management Philosophy
- **Automatic Checkpoints**: Version created before every AI tool call
- **Agent-Aware Versioning**: Track which agent made which changes
- **User-Triggered Saves**: Manual version creation capability
- **Restore Points**: Visual timeline with timestamps and descriptions
- **Non-Destructive**: All versions preserved for session duration
- **Metadata Rich**: Each version includes context, timestamp, agent info, and change description

### Version Storage Strategy
- **Session-Based**: Versions stored in memory/local storage during editing session
- **Checkpoint Triggers**: Before AI analysis, on user request, at intervals
- **Version Metadata**: Timestamp, version number, agent used, change description, file size
- **Restore Interface**: Timeline UI showing restore points with agent attribution and preview capability

## Tech Stack

### Frontend Framework
- **Next.js 14+**: App router, server components
- **React 18+**: Latest React features and patterns
- **TypeScript**: Strict mode, comprehensive typing

### AI Integration
- **CopilotKit**: AI chat interface and tool management
- **OpenAI API**: Primary LLM provider (configurable per agent)
- **Custom Tools**: AI function calling for diff generation
- **Agent Framework**: Custom agent management and execution system

### Editor Technology
- **Monaco Editor**: VS Code editor experience
- **@monaco-editor/react**: React integration wrapper
- **Language Services**: JSON validation, syntax highlighting

### State Management
- **React Hooks**: useState, useReducer for local state
- **Context API**: Global configuration, agent state, and file state
- **Custom Hooks**: Reusable state logic for editor, diffs, versions, agents

### Styling & UI
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions

### Storage & Persistence
- **Local Storage**: User preferences, agent configurations, and session data
- **IndexedDB**: Version history, agent definitions, and large file caching
- **File System API**: Browser file system integration (where supported)

## Development Guidelines

### Code Organization Principles
- **Feature-Based Structure**: Organize by feature, not by file type
- **Agent-Centric Design**: Clear separation between agent logic and UI components
- **Separation of Concerns**: Clear boundaries between UI, logic, and AI integration
- **Dependency Injection**: Configurable dependencies for testing and flexibility
- **Pure Functions**: Prefer pure functions for business logic

### Component Design Patterns
- **Composition over Inheritance**: Build complex components from simple ones
- **Agent Context Providers**: React contexts for agent state management
- **Render Props**: Flexible component APIs
- **Custom Hooks**: Reusable stateful logic
- **Error Boundaries**: Graceful error handling at component level

### State Management Patterns
- **Single Source of Truth**: Centralized state for file content, versions, and agents
- **Agent State Isolation**: Each agent maintains independent configuration state
- **Immutable Updates**: State updates preserve previous state
- **Optimistic Updates**: UI updates before AI confirmation
- **Event-Driven Architecture**: Loose coupling through events

### AI Integration Guidelines
- **Agent Safety**: All agent tools are non-destructive by default
- **Tool Validation**: Validate all agent responses before processing
- **Fallback Strategies**: Graceful degradation when agents fail
- **User Control**: Never apply changes without explicit user approval
- **Agent Isolation**: Agents operate independently without interfering with each other

## Code Guidelines

### TypeScript Standards
```typescript
// Comprehensive interface definitions for agents
// Generic types for reusability across agents
// Runtime validation with Zod for agent configurations
// Strict null checks enabled
// Agent-specific type definitions
```

### Naming Conventions
- **Components**: PascalCase (`DiffViewer`, `AgentSelector`, `FileEditor`)
- **Hooks**: camelCase with `use` prefix (`useAgent`, `useFileEditor`, `useDiffManager`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_AGENT_CONFIG`)
- **Files**: kebab-case (`agent-manager.tsx`, `file-editor.hooks.ts`)
- **Agents**: PascalCase with Agent suffix (`JSONEditorAgent`, `CodeRefactorAgent`)

### Error Handling Strategy
- **Graceful Degradation**: App remains functional when agents or AI features fail
- **Agent Error Isolation**: Agent failures don't affect other agents or core functionality
- **User-Friendly Messages**: Clear error communication to users
- **Error Boundaries**: Prevent crashes from propagating
- **Logging**: Comprehensive logging for debugging and monitoring with agent attribution

### Performance Guidelines
- **Lazy Loading**: Agents and components loaded on demand
- **Agent Caching**: Agent configurations and responses cached appropriately
- **Memoization**: Expensive calculations cached appropriately
- **Debouncing**: User input debounced for API calls
- **Virtualization**: Large file content virtualized in editor

### Testing Strategy
- **Unit Tests**: Pure functions, utility methods, and agent logic
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Full user workflows with different agents
- **Agent Testing**: Isolated testing of agent behaviors and tool interactions
- **AI Mock Testing**: Consistent testing with mocked AI responses per agent

## Project Structure Philosophy

### Modular Architecture
- Each feature is self-contained with its own components, hooks, and utilities
- Agent system is modular and extensible
- Clear API boundaries between modules
- Easy to add/remove features or agents without affecting others

### Configuration-Driven Design
- User preferences control AI behavior
- Agent-specific configurations
- Context-aware tool loading per agent
- Customizable prompts and instructions per agent
- Theme and UI customization

### Extensibility Focus
- Plugin architecture for new file types and agents
- Tool registry for AI capabilities
- Agent marketplace concept for sharing configurations
- Event system for third-party integrations
- API design for future features

## Agent System Architecture

### Agent Configuration Schema
```typescript
interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  customInstructions: string;
  enabledTools: string[];
  contextTypes: string[];
  settings: AgentSettings;
  metadata: AgentMetadata;
}
```

### Agent Management Features
- **Agent Registry**: Central repository of available agents
- **Configuration UI**: Visual agent configuration interface
- **Agent Templates**: Pre-built agent configurations for common tasks
- **Agent Versioning**: Track changes to agent configurations
- **Agent Analytics**: Usage metrics and performance tracking

### Agent Tool System
- **Tool Registry**: Available tools that can be assigned to agents
- **Context-Aware Tools**: Tools that adapt based on agent context
- **Tool Validation**: Ensure tools are compatible with agent capabilities
- **Custom Tool Development**: Framework for creating agent-specific tools

## Success Criteria

### Functional Requirements
- Users can safely edit files with AI assistance from multiple specialized agents
- All changes are reviewable before application with agent attribution
- Complete version history with easy restoration and agent tracking
- Configurable agents with different capabilities and tool sets
- Seamless agent switching and selection for different tasks

### Technical Requirements
- Sub-2-second response times for agent interactions
- Smooth editor performance with files up to 10MB
- Zero data loss with comprehensive version management
- Agent isolation and error handling
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### User Experience Requirements
- Intuitive agent selection and configuration
- Clear diff visualization and approval process with agent context
- Agent-aware version timeline with restore capabilities
- Responsive design for various screen sizes
- Accessible interface following WCAG guidelines
