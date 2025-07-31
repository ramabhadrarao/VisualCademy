import { CodeExplanation } from '../types';

export class CCodeExplainer {
  private static memoryCounter = 0x7fff0000;

  static explainCode(code: string): CodeExplanation[] {
    const lines = code.split('\n');
    const explanations: CodeExplanation[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') return;

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
        explanation: `Preprocessor directive that includes the ${header} header file, providing access to standard library functions.`
      };
    }

    // Main function
    if (line.includes('int main()') || line.includes('int main(')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Entry point of the C program. Execution starts here. Returns an integer status code.'
      };
    }

    // Variable declarations and assignments
    const varMatch = line.match(/^\s*(int|float|double|char|long)\s+(\w+)\s*=\s*(.+);?/);
    if (varMatch) {
      const [, type, varName, value] = varMatch;
      const numValue = parseInt(value.replace(/['"]/g, ''));
      
      let memoryInfo = undefined;
      if (!isNaN(numValue)) {
        memoryInfo = {
          address: `0x${(this.memoryCounter++).toString(16)}`,
          value: numValue.toString(),
          binary: this.toBinary(numValue, type === 'int' ? 32 : 16),
          type: type
        };
      }

      return {
        line: lineNumber,
        code: line,
        explanation: `Declares a ${type} variable '${varName}' and initializes it with value ${value}. Memory is allocated to store this value.`,
        memoryInfo
      };
    }

    // Assignment operations
    const assignMatch = line.match(/(\w+)\s*=\s*(.+);/);
    if (assignMatch) {
      const [, varName, expression] = assignMatch;
      return {
        line: lineNumber,
        code: line,
        explanation: `Assigns the result of expression '${expression}' to variable '${varName}'. The expression is evaluated first, then stored.`
      };
    }

    // Printf statements
    if (line.includes('printf')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Outputs formatted text to the console using the printf function from stdio.h library.'
      };
    }

    // Return statement
    if (line.includes('return')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Returns a value from the function and terminates its execution. In main(), this becomes the program exit code.'
      };
    }

    // Control structures
    if (line.includes('if')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Conditional statement that executes code block only if the condition evaluates to true.'
      };
    }

    if (line.includes('for')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Loop structure with initialization, condition, and increment/decrement parts.'
      };
    }

    if (line.includes('while')) {
      return {
        line: lineNumber,
        code: line,
        explanation: 'Loop that continues executing as long as the condition remains true.'
      };
    }

    // Default case
    return {
      line: lineNumber,
      code: line,
      explanation: 'Code statement - part of the program logic.'
    };
  }

  private static toBinary(num: number, bits: number = 32): string {
    return num.toString(2).padStart(bits, '0');
  }
}