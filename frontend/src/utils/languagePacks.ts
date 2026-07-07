import { extensionSystem, Extension } from './extensionSystem';

// Snippet & Keyword Definitions for Language Packs
export const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  python: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'return', 'yield', 'lambda', 'with', 'as', 'assert', 'pass', 'break', 'continue', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False'],
  javascript: ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'default', 'from', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'async', 'await', 'null', 'undefined', 'true', 'false'],
  typescript: ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum', 'namespace', 'import', 'export', 'default', 'from', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'async', 'await', 'public', 'private', 'protected', 'readonly', 'static', 'null', 'undefined', 'true', 'false'],
  go: ['package', 'import', 'func', 'struct', 'interface', 'type', 'const', 'var', 'if', 'else', 'switch', 'case', 'default', 'for', 'range', 'break', 'continue', 'return', 'select', 'defer', 'go', 'chan', 'map', 'nil', 'true', 'false'],
  rust: ['fn', 'struct', 'enum', 'trait', 'impl', 'use', 'mod', 'pub', 'let', 'mut', 'const', 'static', 'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'return', 'async', 'await', 'unsafe', 'self', 'Self', 'true', 'false'],
  cpp: ['class', 'struct', 'enum', 'union', 'namespace', 'template', 'typename', 'using', 'friend', 'public', 'private', 'protected', 'virtual', 'override', 'const', 'constexpr', 'static', 'inline', 'void', 'int', 'float', 'double', 'char', 'bool', 'true', 'false', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'throw', 'new', 'delete', 'this'],
  java: ['class', 'interface', 'enum', 'package', 'import', 'public', 'private', 'protected', 'static', 'final', 'abstract', 'void', 'int', 'float', 'double', 'boolean', 'char', 'true', 'false', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super'],
  csharp: ['using', 'namespace', 'class', 'struct', 'interface', 'enum', 'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'void', 'int', 'float', 'double', 'bool', 'string', 'true', 'false', 'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'async', 'await'],
  sql: ['select', 'from', 'where', 'insert', 'into', 'update', 'set', 'delete', 'create', 'table', 'alter', 'drop', 'index', 'view', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group', 'by', 'order', 'having', 'union', 'all', 'and', 'or', 'not', 'null', 'in', 'like', 'between', 'exists', 'is', 'as'],
  php: ['function', 'class', 'interface', 'trait', 'namespace', 'use', 'public', 'private', 'protected', 'static', 'const', 'final', 'extends', 'implements', 'if', 'else', 'elseif', 'foreach', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'null', 'true', 'false']
};

export const LANGUAGE_SNIPPETS: Record<string, { label: string; insertText: string; detail: string }[]> = {
  python: [
    { label: 'def', insertText: 'def ${1:function_name}(${2:params}):\n\t"""${3:Docstring}"""\n\t${4:pass}', detail: 'Define Function' },
    { label: 'class', insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}', detail: 'Class definition' },
    { label: 'ifmain', insertText: 'if __name__ == "__main__":\n\t${1:main()}', detail: 'If main block' }
  ],
  javascript: [
    { label: 'afn', insertText: 'const ${1:name} = async (${2:params}) => {\n\t${3}\n};', detail: 'Async Arrow Function' },
    { label: 'clg', insertText: 'console.log(${1:value});', detail: 'Console Log' },
    { label: 'prom', insertText: 'new Promise((resolve, reject) => {\n\t${1}\n})', detail: 'Create Promise' }
  ],
  typescript: [
    { label: 'interface', insertText: 'interface ${1:InterfaceName} {\n\t${2:key}: ${3:type};\n}', detail: 'Interface definition' },
    { label: 'type', insertText: 'type ${1:TypeName} = ${2:string};', detail: 'Type definition' }
  ],
  go: [
    { label: 'errcheck', insertText: 'if err != nil {\n\treturn ${1:nil, }err\n}', detail: 'Error check snippet' },
    { label: 'func', insertText: 'func ${1:FuncName}(${2:params}) ${3:error} {\n\t${4}\n}', detail: 'Function definition' }
  ],
  rust: [
    { label: 'fn', insertText: 'fn ${1:func_name}(${2:params}) -> ${3:Result<(), Error>} {\n\t${4:Ok(())}\n}', detail: 'Fn definition' },
    { label: 'struct', insertText: 'struct ${1:StructName} {\n\t${2:pub field}: ${3:Type},\n}', detail: 'Struct definition' }
  ]
};

// Index symbols in background for definitions mapping
const symbolCache: Map<string, { name: string; line: number; type: string }[]> = new Map();

export const rebuildSymbolIndex = (filePath: string, code: string) => {
  const lines = code.split('\n');
  const symbols: { name: string; line: number; type: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Python/Ruby def/class
    let match = line.match(/^(?:def|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (match) {
      symbols.push({ name: match[1], line: i + 1, type: line.startsWith('def') ? 'function' : 'class' });
      continue;
    }
    // JS/TS/Go function/interface/struct
    match = line.match(/^(?:function|interface|class|struct|type)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (match) {
      symbols.push({ name: match[1], line: i + 1, type: 'definition' });
      continue;
    }
    // JS const definitions const name =
    match = line.match(/^const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
    if (match) {
      symbols.push({ name: match[1], line: i + 1, type: 'const' });
    }
  }
  symbolCache.set(filePath, symbols);
};

// Generic completion provider
const createCompletionProvider = (lang: string) => {
  return {
    triggerCharacters: ['.', '(', '{'],
    provideCompletionItems: (model: any, position: any) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      // Get words in the document for dynamic autocompletion
      const words = Array.from(new Set(model.getValue().match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [])) as string[];
      const suggestions: any[] = [];

      // Add local workspace words
      words.forEach(w => {
        suggestions.push({
          label: w,
          kind: 5, // Field/Variable
          insertText: w,
          detail: 'Local Context'
        });
      });

      // Add language keywords
      const keywords = LANGUAGE_KEYWORDS[lang] || [];
      keywords.forEach(kw => {
        suggestions.push({
          label: kw,
          kind: 17, // Keyword
          insertText: kw,
          detail: `${lang} Keyword`
        });
      });

      // Add snippets
      const snippets = LANGUAGE_SNIPPETS[lang] || [];
      snippets.forEach(snip => {
        suggestions.push({
          label: snip.label,
          kind: 27, // Snippet
          insertText: snip.insertText,
          insertTextRules: 4, // InsertAsSnippet
          detail: snip.detail
        });
      });

      return { suggestions };
    }
  };
};

// Generic hover provider
const createHoverProvider = (lang: string) => {
  return {
    provideHover: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      // Find in symbols
      const symbols = symbolCache.get(model.uri.path) || [];
      const localSym = symbols.find(s => s.name === word.word);

      const contents = [
        { value: `**Symbol:** \`${word.word}\` (${lang})` }
      ];

      if (localSym) {
        contents.push({ value: `Defined locally on line **${localSym.line}** as a *${localSym.type}*.` });
      } else {
        contents.push({ value: `Active reference parsed by CodeGuardian AI Services.` });
      }

      return {
        range: new (window as any).monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents
      };
    }
  };
};

// Generic Definition Provider
const createDefinitionProvider = () => {
  return {
    provideDefinition: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      // Check symbol cache
      const symbols = symbolCache.get(model.uri.path) || [];
      const sym = symbols.find(s => s.name === word.word);
      if (sym) {
        return {
          uri: model.uri,
          range: new (window as any).monaco.Range(sym.line, 1, sym.line, 1)
        };
      }

      // Fallback: Scan text
      const lines = model.getLinesContent();
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`def ${word.word}`) || lines[i].includes(`class ${word.word}`) || lines[i].includes(`const ${word.word}`)) {
          return {
            uri: model.uri,
            range: new (window as any).monaco.Range(i + 1, 1, i + 1, 1)
          };
        }
      }
      return null;
    }
  };
};

// Local Formatting provider
const createFormattingProvider = () => {
  return {
    provideDocumentFormattingEdits: (model: any) => {
      const lines = model.getLinesContent();
      const edits = [];
      for (let i = 0; i < lines.length; i++) {
        const original = lines[i];
        let formatted = original.trimEnd(); // remove trailing spaces
        // simple space corrections around operators
        formatted = formatted.replace(/\s*=\s*/g, ' = ');
        formatted = formatted.replace(/\s*,\s*/g, ', ');
        formatted = formatted.replace(/\s*;\s*/g, ';');
        // keep indent
        if (formatted !== original) {
          edits.push({
            range: new (window as any).monaco.Range(i + 1, 1, i + 1, original.length + 1),
            text: formatted
          });
        }
      }
      return edits;
    }
  };
};

// Diagnostic scanner (Linter)
export const runDiagnosticsScanner = (model: any, monaco: any) => {
  const code = model.getValue();
  const lines = code.split('\n');
  const markers: any[] = [];

  // Check brackets matching
  const stack: { char: string; line: number; col: number }[] = [];
  const matches: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (['(', '[', '{'].includes(c)) {
        stack.push({ char: c, line: i + 1, col: j + 1 });
      } else if ([')', ']', '}'].includes(c)) {
        const top = stack.pop();
        if (!top || top.char !== matches[c]) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `Unmatched closing bracket '${c}'`,
            startLineNumber: i + 1,
            startColumn: j + 1,
            endLineNumber: i + 1,
            endColumn: j + 2
          });
        }
      }
    }
  }

  // Leftover unclosed brackets
  stack.forEach(unclosed => {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: `Unclosed opening bracket '${unclosed.char}'`,
      startLineNumber: unclosed.line,
      startColumn: unclosed.col,
      endLineNumber: unclosed.line,
      endColumn: unclosed.col + 1
    });
  });

  // Language specific diagnostics scans
  const lang = model.getModeId();
  if (lang === 'python') {
    lines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      if ((trimmed.startsWith('def ') || trimmed.startsWith('class ') || trimmed.startsWith('if ') || trimmed.startsWith('for ') || trimmed.startsWith('while ')) && !trimmed.endsWith(':')) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: "Python statements definition missing trailing colon ':'",
          startLineNumber: idx + 1,
          startColumn: line.length - trimmed.length + 1,
          endLineNumber: idx + 1,
          endColumn: line.length + 1
        });
      }
    });
  }

  monaco.editor.setModelMarkers(model, 'linter', markers);
};

// REGISTER PACKS
export const registerAllLanguagePacks = () => {
  const languages = ['python', 'javascript', 'typescript', 'go', 'rust', 'cpp', 'java', 'csharp', 'sql', 'php'];

  languages.forEach(lang => {
    extensionSystem.register({
      id: `lang-${lang}`,
      name: `${lang.toUpperCase()} Language Service`,
      description: `Syntax helpers, autocompletes, definitions, and hover docs for ${lang}`,
      category: 'language',
      activate: (context) => {
        context.registerCompletionProvider(lang, createCompletionProvider(lang));
        context.registerHoverProvider(lang, createHoverProvider(lang));
        context.registerDefinitionProvider(lang, createDefinitionProvider());
        context.registerFormattingProvider(lang, createFormattingProvider());
      }
    });
  });

  // DevOps Pack
  extensionSystem.register({
    id: 'lang-dockerterraform',
    name: 'DevOps Language Services',
    description: 'Snippets and definitions for Dockerfiles, Kubernetes, and Terraform YAML',
    category: 'devops',
    activate: (context) => {
      const devopsLangs = ['dockerfile', 'yaml', 'terraform'];
      devopsLangs.forEach(dl => {
        context.registerCompletionProvider(dl, {
          provideCompletionItems: () => {
            return {
              suggestions: [
                { label: 'FROM', kind: 17, insertText: 'FROM node:18-alpine', detail: 'Docker base image' },
                { label: 'RUN', kind: 17, insertText: 'RUN npm install', detail: 'Docker build command' },
                { label: 'apiVersion', kind: 17, insertText: 'apiVersion: apps/v1\nkind: Deployment', detail: 'Kubernetes layout' },
                { label: 'resource', kind: 17, insertText: 'resource "${1:aws_instance}" "${2:web}" {\n\tami = "${3:ami-id}"\n}', insertTextRules: 4, detail: 'Terraform resource' }
              ]
            };
          }
        });
      });
    }
  });

  // Linter syntax extension
  extensionSystem.register({
    id: 'linter-syntax',
    name: 'Linter Diagnostics',
    description: 'Calculates brackets parsing, python semicolons, and code analysis warnings',
    category: 'linter',
    activate: (context) => {
      // Triggered by code edits from main page
    }
  });

  // Prettier Formatter
  extensionSystem.register({
    id: 'formatter-prettier',
    name: 'Format Code',
    description: 'Custom code spacing, indentation, and alignment rules',
    category: 'formatter',
    activate: (context) => {
      // Handles registered via context.registerFormattingProvider
    }
  });

  // AI Copilot Provider
  extensionSystem.register({
    id: 'ai-copilot',
    name: 'CodeGuardian AI Copilot',
    description: 'Suggests diagnostics fixes, documentation descriptions, and test flows directly in context',
    category: 'ai',
    activate: (context) => {
      context.registerCodeActionProvider('*', {
        provideCodeActions: (model: any, range: any) => {
          return {
            actions: [
              {
                title: 'Explain with CodeGuardian AI',
                diagnostics: [],
                kind: 'quickfix',
                command: { id: 'explain', title: 'Explain', arguments: [model.getValueInRange(range)] }
              },
              {
                title: 'Optimize Selection with AI',
                diagnostics: [],
                kind: 'refactor',
                command: { id: 'optimize', title: 'Optimize', arguments: [model.getValueInRange(range)] }
              }
            ],
            dispose: () => {}
          };
        }
      });
    }
  });

  // Cyberpunk Glass Theme
  extensionSystem.register({
    id: 'theme-cyberpunk',
    name: 'Cyberpunk Neon Theme',
    description: 'Electric purples and dark background neon styling',
    category: 'theme',
    activate: (context) => {
      context.monaco.editor.defineTheme('cyberpunk', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
          { token: 'string', foreground: '50fa7b' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'type', foreground: '8be9fd' }
        ],
        colors: {
          'editor.background': '#0c0714',
          'editor.foreground': '#f8f8f2',
          'editor.lineHighlightBackground': '#ff79c61a',
          'editorCursor.foreground': '#ff79c6',
          'editorLineNumber.foreground': '#8be9fd4d',
          'editorLineNumber.activeForeground': '#8be9fd'
        }
      });
    }
  });
};
