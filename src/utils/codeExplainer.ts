import { CodeExplanation } from '../types';

interface Variable {
  name: string;
  type: string;
  value: any;
  address: string;
  size: number;
}

interface StructMember {
  name: string;
  type: string;
  offset: number;
}

export class CCodeExplainer {
  private static memoryCounter = 0x7fff0000;
  private static variables = new Map<string, Variable>();
  private static structs = new Map<string, StructMember[]>();
  private static currentScope: string[] = [];

  static explainCode(code: string): CodeExplanation[] {
    const lines = code.split('\n');
    const explanations: CodeExplanation[] = [];
    this.variables.clear();
    this.structs.clear();
    this.memoryCounter = 0x7fff0000;
    this.currentScope = [];
    
    // Track struct definitions
    let inStructDef = false;
    let currentStruct = '';
    let structMembers: StructMember[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and single braces
      if (trimmedLine === '' || trimmedLine === '{' || trimmedLine === '}') {
        if (trimmedLine === '}' && inStructDef) {
          this.structs.set(currentStruct, [...structMembers]);
          inStructDef = false;
          structMembers = [];
        }
        return;
      }

      // Handle struct definitions
      if (trimmedLine.startsWith('struct') && trimmedLine.includes('{')) {
        inStructDef = true;
        currentStruct = trimmedLine.match(/struct\s+(\w+)/)?.[1] || 'unnamed';
        return;
      }

      if (inStructDef) {
        const memberMatch = trimmedLine.match(/^\s*(int|float|double|char|long|short)\s+(\w+)\s*;/);
        if (memberMatch) {
          structMembers.push({
            name: memberMatch[2],
            type: memberMatch[1],
            offset: structMembers.reduce((sum, m) => sum + this.getTypeSize(m.type), 0)
          });
        }
        return;
      }

      const explanation = this.explainLine(trimmedLine, index + 1);
      if (explanation) {
        explanations.push(explanation);
      }
    });

    return explanations;
  }

  private static explainLine(line: string, lineNumber: number): CodeExplanation | null {
    // Include directive
    if (line.includes('#include')) {
      const header = line.match(/<(.+)>|"(.+)"/)?.[1] || line.match(/<(.+)>|"(.+)"/)?.[2];
      return {
        line: lineNumber,
        code: line,
        explanation: `Preprocessor directive that includes the ${header} header file. This provides access to standard library functions and definitions.`
      };
    }

    // Function definitions
    if (line.match(/^\s*(int|void|float|double|char)\s+\w+\s*\(/)) {
      const funcMatch = line.match(/^\s*(\w+)\s+(\w+)\s*\(/);
      if (funcMatch) {
        return {
          line: lineNumber,
          code: line,
          explanation: `Function definition: '${funcMatch[2]}' returns ${funcMatch[1]}. ${funcMatch[2] === 'main' ? 'This is the program entry point.' : 'Custom function definition.'}`
        };
      }
    }

    // Variable declarations with initialization
    const declWithInit = line.match(/^\s*(unsigned\s+)?(int|float|double|char|long|short)\s+(\w+)\s*=\s*(.+?);/);
    if (declWithInit) {
      const [, unsigned, type, varName, value] = declWithInit;
      const fullType = (unsigned || '') + type;
      return this.createVariableExplanation(line, lineNumber, fullType.trim(), varName, value);
    }

    // Variable declarations without initialization
    const declOnly = line.match(/^\s*(unsigned\s+)?(int|float|double|char|long|short)\s+(\w+)\s*;/);
    if (declOnly) {
      const [, unsigned, type, varName] = declOnly;
      const fullType = (unsigned || '') + type;
      return this.createVariableExplanation(line, lineNumber, fullType.trim(), varName, null);
    }

    // Array declarations with initialization
    const arrayWithInit = line.match(/^\s*(int|float|double|char|long|short)\s+(\w+)\s*\[\s*(\d*)\s*\]\s*=\s*\{([^}]+)\}/);
    if (arrayWithInit) {
      const [, type, varName, sizeStr, values] = arrayWithInit;
      const size = sizeStr ? parseInt(sizeStr) : values.split(',').length;
      return this.createArrayExplanation(line, lineNumber, type, varName, size, values);
    }

    // Array declarations without initialization
    const arrayDecl = line.match(/^\s*(int|float|double|char|long|short)\s+(\w+)\s*\[\s*(\d+)\s*\]/);
    if (arrayDecl) {
      const [, type, varName, size] = arrayDecl;
      return this.createArrayExplanation(line, lineNumber, type, varName, parseInt(size), null);
    }

    // Pointer declarations
    const pointerDecl = line.match(/^\s*(int|float|double|char|long|short)\s*\*+\s*(\w+)/);
    if (pointerDecl) {
      const [match, type, varName] = pointerDecl;
      const pointerLevel = (match.match(/\*/g) || []).length;
      return this.createPointerExplanation(line, lineNumber, type, varName, pointerLevel);
    }

    // Structure variable declarations
    const structDecl = line.match(/^\s*struct\s+(\w+)\s+(\w+)/);
    if (structDecl) {
      const [, structType, varName] = structDecl;
      return this.createStructVariableExplanation(line, lineNumber, structType, varName);
    }

    // Assignment operations
    const assignMatch = line.match(/^\s*(\w+)\s*=\s*(.+);/);
    if (assignMatch) {
      const [, varName, expression] = assignMatch;
      return this.createAssignmentExplanation(line, lineNumber, varName, expression);
    }

    // Array element assignment
    const arrayAssign = line.match(/^\s*(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(.+);/);
    if (arrayAssign) {
      const [, varName, index, value] = arrayAssign;
      return this.createArrayElementExplanation(line, lineNumber, varName, parseInt(index), value);
    }

    // Printf statements
    if (line.includes('printf')) {
      const formatMatch = line.match(/printf\s*\(\s*"([^"]+)"/);
      return {
        line: lineNumber,
        code: line,
        explanation: `Outputs formatted text to console. Format string: "${formatMatch?.[1] || ''}". Uses stdio.h library functions.`
      };
    }

    // Scanf statements
    if (line.includes('scanf')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Reads formatted input from the user. Stores input values at specified memory addresses.'
      };
    }

    // Return statement
    if (line.includes('return')) {
      const returnValue = line.match(/return\s+(.+);/)?.[1] || '0';
      return {
        line: lineNumber,
        code: line,
        explanation: `Returns ${returnValue} from the function. In main(), this becomes the program's exit code (0 = success).`
      };
    }

    // Control structures
    if (line.match(/^\s*if\s*\(/)) {
      const condition = line.match(/if\s*\(([^)]+)\)/)?.[1];
      return {
        line: lineNumber,
        code: line,
        explanation: `Conditional branch: executes following block only if (${condition}) evaluates to true (non-zero).`
      };
    }

    if (line.match(/^\s*for\s*\(/)) {
      const forMatch = line.match(/for\s*\(([^;]+);\s*([^;]+);\s*([^)]+)\)/);
      if (forMatch) {
        return {
          line: lineNumber,
          code: line,
          explanation: `Loop: Initialize (${forMatch[1]}), Continue while (${forMatch[2]}), Update (${forMatch[3]}) after each iteration.`
        };
      }
    }

    if (line.match(/^\s*while\s*\(/)) {
      const condition = line.match(/while\s*\(([^)]+)\)/)?.[1];
      return {
        line: lineNumber,
        code: line,
        explanation: `Loop: continues executing while (${condition}) remains true. Condition checked before each iteration.`
      };
    }

    // Function calls
    const funcCall = line.match(/^\s*(\w+)\s*\([^)]*\)\s*;/);
    if (funcCall && !line.includes('printf') && !line.includes('scanf')) {
      return {
        line: lineNumber,
        code: line,
        explanation: `Function call to '${funcCall[1]}'. Transfers control to the function, executes it, then returns here.`
      };
    }

    return null;
  }

  private static createVariableExplanation(
    line: string, 
    lineNumber: number, 
    type: string, 
    varName: string, 
    value: string | null
  ): CodeExplanation {
    let memoryInfo = undefined;
    let actualValue = value;
    let explanation = '';
    const typeSize = this.getTypeSize(type);
    const address = `0x${(this.memoryCounter).toString(16).padStart(8, '0')}`;

    // Parse the value if it exists
    if (value !== null) {
      if (type === 'char' && value.includes("'")) {
        const charValue = value.match(/'(.)'/)![1];
        actualValue = charValue.charCodeAt(0).toString();
      } else {
        actualValue = value.replace(/['"]/g, '').trim();
      }
    }

    // Store variable info
    this.variables.set(varName, { 
      name: varName,
      type, 
      value: actualValue, 
      address,
      size: typeSize 
    });

    // Generate memory info based on type
    switch (type) {
      case 'int':
      case 'unsigned int':
        this.memoryCounter += 4;
        if (actualValue !== null) {
          const intVal = parseInt(actualValue) || 0;
          memoryInfo = {
            address,
            value: intVal.toString(),
            binary: this.toBinary(intVal, 32, type.includes('unsigned')),
            type: type
          };
        }
        explanation = `Declares ${type} variable '${varName}'${value ? ` initialized to ${value}` : ''}. Allocates 4 bytes (32 bits) of memory.`;
        break;

      case 'long':
      case 'unsigned long':
        this.memoryCounter += 8;
        if (actualValue !== null) {
          const longVal = parseInt(actualValue) || 0;
          memoryInfo = {
            address,
            value: longVal.toString(),
            binary: this.toBinary(longVal, 64, type.includes('unsigned')),
            type: type
          };
        }
        explanation = `Declares ${type} variable '${varName}'${value ? ` initialized to ${value}` : ''}. Allocates 8 bytes (64 bits) of memory.`;
        break;

      case 'short':
      case 'unsigned short':
        this.memoryCounter += 2;
        if (actualValue !== null) {
          const shortVal = parseInt(actualValue) || 0;
          memoryInfo = {
            address,
            value: shortVal.toString(),
            binary: this.toBinary(shortVal, 16, type.includes('unsigned')),
            type: type
          };
        }
        explanation = `Declares ${type} variable '${varName}'${value ? ` initialized to ${value}` : ''}. Allocates 2 bytes (16 bits) of memory.`;
        break;

      case 'char':
      case 'unsigned char':
        this.memoryCounter += 1;
        if (actualValue !== null) {
          const charVal = parseInt(actualValue) || 0;
          memoryInfo = {
            address,
            value: value!.includes("'") ? `'${String.fromCharCode(charVal)}' (ASCII: ${charVal})` : charVal.toString(),
            binary: this.toBinary(charVal, 8, type.includes('unsigned')),
            type: type
          };
        }
        explanation = `Declares ${type} variable '${varName}'${value ? ` initialized to ${value}` : ''}. Allocates 1 byte (8 bits) of memory.`;
        break;

      case 'float':
        this.memoryCounter += 4;
        if (actualValue !== null) {
          const floatVal = parseFloat(actualValue) || 0;
          memoryInfo = {
            address,
            value: floatVal.toFixed(6),
            binary: this.floatToBinary(floatVal),
            type: type
          };
        }
        explanation = `Declares ${type} variable '${varName}'${value ? ` initialized to ${value}` : ''}. Allocates 4 bytes for IEEE 754 single-precision float.`;
        break;

      case 'double':
        this.memoryCounter += 8;
        if (actualValue !== null) {
          const doubleVal = parseFloat(actualValue) || 0;
          memoryInfo = {
            address,
            value: doubleVal.toString(),
            binary: this.doubleToBinary(doubleVal),
            type: type
          };
        }
        explanation = `Declares ${type} variable '${varName}'${value ? ` initialized to ${value}` : ''}. Allocates 8 bytes for IEEE 754 double-precision float.`;
        break;
    }

    return {
      line: lineNumber,
      code: line,
      explanation,
      memoryInfo
    };
  }

  private static createAssignmentExplanation(
    line: string,
    lineNumber: number,
    varName: string,
    expression: string
  ): CodeExplanation {
    const variable = this.variables.get(varName);
    if (!variable) {
      return {
        line: lineNumber,
        code: line,
        explanation: `Assignment to '${varName}'. Variable must be declared before use.`
      };
    }

    // Handle arithmetic expressions
    const arithMatch = expression.match(/(\w+)\s*([+\-*/])\s*(\w+)/);
    if (arithMatch) {
      const [, var1, operator, var2] = arithMatch;
      const val1 = this.variables.get(var1)?.value || var1;
      const val2 = this.variables.get(var2)?.value || var2;
      
      let result = 0;
      const num1 = parseFloat(val1);
      const num2 = parseFloat(val2);
      
      switch (operator) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': result = num1 / num2; break;
      }

      // Update variable value
      variable.value = result.toString();
      
      return {
        line: lineNumber,
        code: line,
        explanation: `Arithmetic operation: ${var1} ${operator} ${var2} = ${num1} ${operator} ${num2} = ${result}. Result stored in '${varName}'.`,
        memoryInfo: {
          address: variable.address,
          value: result.toString(),
          binary: variable.type.includes('float') || variable.type.includes('double') 
            ? this.floatToBinary(result) 
            : this.toBinary(Math.floor(result), variable.size * 8),
          type: variable.type
        }
      };
    }

    // Handle pointer operations
    if (expression.includes('&')) {
      const targetVar = expression.match(/&(\w+)/)?.[1];
      if (targetVar && this.variables.has(targetVar)) {
        const target = this.variables.get(targetVar)!;
        variable.value = target.address;
        
        return {
          line: lineNumber,
          code: line,
          explanation: `Address-of operator: &${targetVar} gets the memory address of '${targetVar}' (${target.address}). Stored in pointer '${varName}'.`,
          memoryInfo: {
            address: variable.address,
            value: target.address,
            binary: this.addressToBinary(target.address),
            type: variable.type
          }
        };
      }
    }

    // Simple assignment
    variable.value = expression.replace(/['"]/g, '').trim();
    
    return {
      line: lineNumber,
      code: line,
      explanation: `Assignment: '${varName}' = ${expression}. Updates the value stored at memory address ${variable.address}.`,
      memoryInfo: {
        address: variable.address,
        value: variable.value,
        binary: this.valueToBinary(variable.value, variable.type, variable.size),
        type: variable.type
      }
    };
  }

  private static createArrayExplanation(
    line: string,
    lineNumber: number,
    type: string,
    varName: string,
    size: number,
    values: string | null
  ): CodeExplanation {
    const elementSize = this.getTypeSize(type);
    const totalBytes = elementSize * size;
    const address = `0x${this.memoryCounter.toString(16).padStart(8, '0')}`;
    const endAddress = `0x${(this.memoryCounter + totalBytes - 1).toString(16).padStart(8, '0')}`;
    
    this.variables.set(varName, {
      name: varName,
      type: `${type}[${size}]`,
      value: values || `uninitialized[${size}]`,
      address,
      size: totalBytes
    });
    
    this.memoryCounter += totalBytes;

    let binaryRep = '';
    if (values) {
      const valueArray = values.split(',').map(v => v.trim());
      valueArray.forEach((val, idx) => {
        if (idx < size) {
          const numVal = parseFloat(val) || 0;
          binaryRep += this.toBinary(Math.floor(numVal), elementSize * 8) + ' ';
        }
      });
    } else {
      binaryRep = `${totalBytes * 8} bits (uninitialized)`;
    }

    return {
      line: lineNumber,
      code: line,
      explanation: `Array declaration: '${varName}' with ${size} elements of type ${type}. Allocates ${totalBytes} contiguous bytes (${elementSize}B × ${size}).${values ? ' Initialized with provided values.' : ''}`,
      memoryInfo: {
        address: `${address} → ${endAddress}`,
        value: `Array[${size}]${values ? `: {${values}}` : ''}`,
        binary: binaryRep.trim(),
        type: `${type}[${size}]`
      }
    };
  }

  private static createArrayElementExplanation(
    line: string,
    lineNumber: number,
    varName: string,
    index: number,
    value: string
  ): CodeExplanation {
    const array = this.variables.get(varName);
    if (!array) {
      return {
        line: lineNumber,
        code: line,
        explanation: `Array element assignment: ${varName}[${index}] = ${value}. Array must be declared first.`
      };
    }

    const baseType = array.type.split('[')[0];
    const elementSize = this.getTypeSize(baseType);
    const elementAddress = parseInt(array.address, 16) + (index * elementSize);
    
    return {
      line: lineNumber,
      code: line,
      explanation: `Array element assignment: ${varName}[${index}] = ${value}. Updates element at offset ${index * elementSize} bytes from array base.`,
      memoryInfo: {
        address: `0x${elementAddress.toString(16).padStart(8, '0')}`,
        value: value,
        binary: this.valueToBinary(value, baseType, elementSize),
        type: baseType
      }
    };
  }

  private static createPointerExplanation(
    line: string,
    lineNumber: number,
    type: string,
    varName: string,
    pointerLevel: number
  ): CodeExplanation {
    const address = `0x${this.memoryCounter.toString(16).padStart(8, '0')}`;
    this.memoryCounter += 8; // 64-bit pointer

    const pointerType = type + '*'.repeat(pointerLevel);
    
    this.variables.set(varName, {
      name: varName,
      type: pointerType,
      value: 'NULL',
      address,
      size: 8
    });

    return {
      line: lineNumber,
      code: line,
      explanation: `Pointer declaration: '${varName}' is a ${pointerLevel > 1 ? `level-${pointerLevel} pointer to` : 'pointer to'} ${type}. Can store memory address. Pointer itself uses 8 bytes (64-bit).`,
      memoryInfo: {
        address,
        value: 'NULL (0x0000000000000000)',
        binary: '0'.repeat(64),
        type: pointerType
      }
    };
  }

  private static createStructVariableExplanation(
    line: string,
    lineNumber: number,
    structType: string,
    varName: string
  ): CodeExplanation {
    const structDef = this.structs.get(structType);
    if (!structDef) {
      return {
        line: lineNumber,
        code: line,
        explanation: `Structure variable '${varName}' of type 'struct ${structType}'. Structure must be defined before use.`
      };
    }

    const totalSize = structDef.reduce((sum, member) => 
      sum + this.getTypeSize(member.type), 0
    );
    
    const address = `0x${this.memoryCounter.toString(16).padStart(8, '0')}`;
    this.memoryCounter += totalSize;

    return {
      line: lineNumber,
      code: line,
      explanation: `Structure variable '${varName}' of type 'struct ${structType}'. Allocates ${totalSize} bytes for all members: ${structDef.map(m => `${m.name}(${m.type})`).join(', ')}.`,
      memoryInfo: {
        address: `${address} (base)`,
        value: `struct ${structType} { ${structDef.length} members }`,
        binary: `${totalSize * 8} bits allocated`,
        type: `struct ${structType}`
      }
    };
  }

  private static getTypeSize(type: string): number {
    if (type.includes('double') || type.includes('long')) return 8;
    if (type.includes('int') || type.includes('float')) return 4;
    if (type.includes('short')) return 2;
    if (type.includes('char')) return 1;
    if (type.includes('*')) return 8; // pointer
    return 4; // default
  }

  private static toBinary(num: number, bits: number = 32, unsigned: boolean = false): string {
    if (!unsigned && num < 0) {
      // Two's complement for negative numbers
      num = Math.pow(2, bits) + num;
    }
    return num.toString(2).padStart(bits, '0').match(/.{1,8}/g)!.join(' ');
  }

  private static floatToBinary(num: number): string {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, num);
    const int = view.getUint32(0);
    const binary = int.toString(2).padStart(32, '0');
    
    // Format: sign (1) | exponent (8) | mantissa (23)
    return `${binary.slice(0, 1)} ${binary.slice(1, 9)} ${binary.slice(9)}`;
  }

  private static doubleToBinary(num: number): string {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, num);
    const high = view.getUint32(0);
    const low = view.getUint32(4);
    const binary = high.toString(2).padStart(32, '0') + low.toString(2).padStart(32, '0');
    
    // Format: sign (1) | exponent (11) | mantissa (52)
    return `${binary.slice(0, 1)} ${binary.slice(1, 12)} ${binary.slice(12, 32)} ${binary.slice(32)}`;
  }

  private static addressToBinary(address: string): string {
    const num = parseInt(address, 16);
    return this.toBinary(num, 64);
  }

  private static valueToBinary(value: string, type: string, size: number): string {
    if (type.includes('float') || type.includes('double')) {
      const floatVal = parseFloat(value) || 0;
      return type.includes('double') ? this.doubleToBinary(floatVal) : this.floatToBinary(floatVal);
    }
    
    const intVal = parseInt(value) || 0;
    return this.toBinary(intVal, size * 8, type.includes('unsigned'));
  }
}