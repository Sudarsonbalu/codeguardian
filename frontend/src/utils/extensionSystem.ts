import { Monaco } from '@monaco-editor/react';

export interface ExtensionContext {
  monaco: any;
  editor: any;
  registerCompletionProvider: (language: string, provider: any) => any;
  registerHoverProvider: (language: string, provider: any) => any;
  registerDefinitionProvider: (language: string, provider: any) => any;
  registerSignatureHelpProvider: (language: string, provider: any) => any;
  registerCodeActionProvider: (language: string, provider: any) => any;
  registerFormattingProvider: (language: string, provider: any) => any;
  registerRenameProvider: (language: string, provider: any) => any;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  category: 'language' | 'linter' | 'formatter' | 'theme' | 'ai' | 'git' | 'devops' | 'testing';
  activate: (context: ExtensionContext) => void;
  deactivate?: () => void;
}

class ExtensionSystemManager {
  private extensions: Map<string, Extension> = new Map();
  private activeExtensions: Map<string, any[]> = new Map(); // extensionId -> disposables[]
  private enabledExtensionIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enabled_extensions');
      if (saved) {
        try {
          this.enabledExtensionIds = new Set(JSON.parse(saved));
        } catch {
          // fall back to default extensions
        }
      } else {
        // default enabled extensions
        this.enabledExtensionIds = new Set([
          'theme-cyberpunk', 'lang-python', 'lang-typescript', 'lang-golang', 
          'lang-rust', 'lang-cpp', 'lang-sql', 'lang-htmlcss', 'lang-dockerterraform',
          'ai-copilot', 'formatter-prettier', 'linter-syntax'
        ]);
        this.saveEnabled();
      }
    }
  }

  public register(extension: Extension) {
    this.extensions.set(extension.id, extension);
  }

  public getExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  public isEnabled(id: string): boolean {
    return this.enabledExtensionIds.has(id);
  }

  public enableExtension(id: string, monaco: any, editor: any) {
    this.enabledExtensionIds.add(id);
    this.saveEnabled();
    this.activateExtension(id, monaco, editor);
  }

  public disableExtension(id: string) {
    this.enabledExtensionIds.delete(id);
    this.saveEnabled();
    this.deactivateExtension(id);
  }

  public activateAll(monaco: any, editor: any) {
    for (const id of this.enabledExtensionIds) {
      this.activateExtension(id, monaco, editor);
    }
  }

  public deactivateAll() {
    for (const id of this.extensions.keys()) {
      this.deactivateExtension(id);
    }
  }

  private activateExtension(id: string, monaco: any, editor: any) {
    const ext = this.extensions.get(id);
    if (!ext || this.activeExtensions.has(id)) return;
    if (!monaco || !editor) {
      console.warn(`Skipping activation of extension '${id}': Monaco or editor instance is not loaded yet.`);
      return;
    }

    const disposables: any[] = [];
    const context: ExtensionContext = {
      monaco,
      editor,
      registerCompletionProvider: (lang, prov) => {
        const d = monaco.languages.registerCompletionItemProvider(lang, prov);
        disposables.push(d);
        return d;
      },
      registerHoverProvider: (lang, prov) => {
        const d = monaco.languages.registerHoverProvider(lang, prov);
        disposables.push(d);
        return d;
      },
      registerDefinitionProvider: (lang, prov) => {
        const d = monaco.languages.registerDefinitionProvider(lang, prov);
        disposables.push(d);
        return d;
      },
      registerSignatureHelpProvider: (lang, prov) => {
        const d = monaco.languages.registerSignatureHelpProvider(lang, prov);
        disposables.push(d);
        return d;
      },
      registerCodeActionProvider: (lang, prov) => {
        const d = monaco.languages.registerCodeActionProvider(lang, prov);
        disposables.push(d);
        return d;
      },
      registerFormattingProvider: (lang, prov) => {
        const d = monaco.languages.registerDocumentFormattingEditProvider(lang, prov);
        disposables.push(d);
        return d;
      },
      registerRenameProvider: (lang, prov) => {
        const d = monaco.languages.registerRenameProvider(lang, prov);
        disposables.push(d);
        return d;
      }
    };

    try {
      ext.activate(context);
      this.activeExtensions.set(id, disposables);
    } catch (err) {
      console.error(`Failed to activate extension ${id}`, err);
    }
  }

  private deactivateExtension(id: string) {
    const disposables = this.activeExtensions.get(id);
    if (disposables) {
      disposables.forEach(d => {
        if (d && typeof d.dispose === 'function') {
          d.dispose();
        }
      });
      this.activeExtensions.delete(id);
    }
    const ext = this.extensions.get(id);
    if (ext && ext.deactivate) {
      try {
        ext.deactivate();
      } catch (err) {
        console.error(`Failed to deactivate extension ${id}`, err);
      }
    }
  }

  private saveEnabled() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('enabled_extensions', JSON.stringify(Array.from(this.enabledExtensionIds)));
    }
  }
}

export const extensionSystem = new ExtensionSystemManager();
