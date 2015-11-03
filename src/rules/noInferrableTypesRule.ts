/*
 * Copyright 2015 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as Lint from "../lint";
import * as ts from "typescript";

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING_FACTORY = (type: string) => `LHS type (${type}) inferred by RHS expression, remove type annotation`;

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new InferrableTypeWalker(sourceFile, this.getOptions()));
    }
}

class InferrableTypeWalker extends Lint.RuleWalker {
    public visitVariableDeclaration(node: ts.VariableDeclaration) {
        this.checkDeclaration(node);
        super.visitVariableDeclaration(node);
    }

    public visitParameterDeclaration(node: ts.ParameterDeclaration) {
        this.checkDeclaration(node);
        super.visitParameterDeclaration(node);
    }

    private checkDeclaration(node: ts.ParameterDeclaration | ts.VariableDeclaration) {
        if (node.type != null && node.initializer != null) {
            let failure: string;
            switch (node.type.kind) {
                case ts.SyntaxKind.BooleanKeyword:
                    if (node.initializer.kind === ts.SyntaxKind.TrueKeyword || node.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                        failure = "boolean";
                    }
                break;
                case ts.SyntaxKind.NumberKeyword:
                    if (node.initializer.kind === ts.SyntaxKind.NumericLiteral) {
                        failure = "number";
                    }
                break;
                case ts.SyntaxKind.StringKeyword:
                    switch (node.initializer.kind) {
                        case ts.SyntaxKind.StringLiteral:
                        case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                        case ts.SyntaxKind.TemplateExpression:
                            failure = "string";
                            break;
                        default:
                            break;
                    }
                break;
            }
            if (failure) {
                this.addFailure(this.createFailure(node.type.getStart(), node.type.getWidth(), Rule.FAILURE_STRING_FACTORY(failure)));
            }
        }
    }
}