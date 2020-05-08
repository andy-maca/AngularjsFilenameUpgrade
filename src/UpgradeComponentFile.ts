import * as vscode from 'vscode';
import { move } from './PerforceService';

export function upgradeComponentFile(uri: vscode.Uri) {
  const oldPath = uri.fsPath;
  const paths = oldPath.split("\\");
  const ng1Name = paths.pop();
  const fileDir = paths.join("\\");
  const nameMatches = ng1Name?.match(/(\w+)Component.ts/);
  if (nameMatches) {
    const ng2Name = convertCamelCaseName(nameMatches[1]);
    const newPrefixPath =  `${fileDir}\\${ng2Name}\\${ng2Name}.component`;
    move(oldPath, `${newPrefixPath}.ts`);
    renameTemplateIfExist(oldPath, newPrefixPath);
  }
}


function convertCamelCaseName(ng1Name: string) {
  return ng1Name.split(/(?<![A-Z])(?=[A-Z])/).map((s)=>s.toLocaleLowerCase()).join("-");
}


function renameTemplateIfExist(oldPath: string, newPrefixPath: string) {
  const oldTemplateFile = oldPath.replace(".ts",".html");
  vscode.workspace.fs.stat(vscode.Uri.file(oldTemplateFile)).then(()=>{
    move(oldTemplateFile,`${newPrefixPath}.html`, false);
  }, (reason)=> {
    //ignore
  });
}

