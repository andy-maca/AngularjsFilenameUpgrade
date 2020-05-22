import * as vscode from 'vscode';
import { move, edit, checkLoginStatus } from './PerforceService';
import { Ng1FileInformation } from './Ng1FileInformation';
import { TextDecoder, TextEncoder } from 'util';


export function upgradeFile(uri: vscode.Uri) {
  checkLoginStatus().then(() => {
    const fileInfo = new Ng1FileInformation(uri);
    if(fileInfo.ext !== "ts") {
      return;
    }
  
    if(fileInfo.type === "component") {
      upgradeComponentFile(fileInfo);
    } else {
      move(fileInfo.uri.fsPath, `${fileInfo.dir}\\${fileInfo.ng2FileName}`);
      
      adjustFilesWhichImportOldFile(fileInfo.ng1FileNameWithoutExt,`${fileInfo.ng2FileNameWithoutExt}`).then(() => {
        renameFileIfExist(`${fileInfo.dir}\\unittest\\${fileInfo.ng1FileNameWithoutExt}Test.ts`, `${fileInfo.dir}\\${fileInfo.ng2FileNameWithoutExt}.spec.ts`).then(() => {
          adjustRelativePathInTestFile(vscode.Uri.file(`${fileInfo.dir}\\${fileInfo.ng2FileNameWithoutExt}.spec.ts`));
        });
      });
    }
  }, () => {
    vscode.window.showErrorMessage("Perforce error!");
  });
  
}


function upgradeComponentFile(fileInfo: Ng1FileInformation) {
  const componentName = fileInfo.ng2FileNameWithoutExt?.replace(".component", "");
  const newPrefixPath =  `${fileInfo.dir}\\${componentName}\\${fileInfo.ng2FileNameWithoutExt}`;
  
  //rename component
  move(fileInfo.uri.fsPath, `${newPrefixPath}.ts`).then(() => {
    adjustPathInNewComponent(vscode.Uri.file(`${newPrefixPath}.ts`), fileInfo.ng1FileNameWithoutExt, fileInfo.ng2FileNameWithoutExt);
  });
  
  //rename template
  renameFileIfExist(fileInfo.uri.fsPath.replace(".ts",".html"), `${newPrefixPath}.html`);
  
  //adjust other files which import the old component
  adjustFilesWhichImportOldFile(fileInfo.ng1FileNameWithoutExt,`${componentName}/${fileInfo.ng2FileNameWithoutExt}`).then(() => {
    //rename unittest
    renameFileIfExist(`${fileInfo.dir}\\unittest\\${fileInfo.ng1FileNameWithoutExt}Test.ts`, `${newPrefixPath}.spec.ts`);
  });
}


function renameFileIfExist(oldFile: string, newFile: string, showFileAfterRename: boolean = false) {
  return new Promise((resolve, reject) => {
    vscode.workspace.fs.stat(vscode.Uri.file(oldFile)).then(()=>{
      move(oldFile,`${newFile}`, showFileAfterRename).then(() => {
        resolve(true);
      }, (reason) => {
        reject(reason);
      });
    }, (reason)=> {
      reject(reason);
    });
  });
}


/**
 * adjust the relative path in `newFile` once it is moved from `oldDir`
 * @param file 
 * @param oldDir 
 */
function adjustRelativePathInTestFile(newFile: vscode.Uri) {
  vscode.workspace.fs.readFile(newFile).then((bytes) => {
    const oldTxt = bytes.toString();
    let newText = "";
    
    if(!newFile.fsPath.includes(".component.")) {
      newText = oldTxt
      .replace(/(import[^"]+")\.\/(.*")/g, "$1./unittest/$2") // "./abc" -> "./unittest/abc"
      .replace(/(import[^"]+")\.\.\/(.*")/g, "$1./$2"); // "../abc" -> "./abc"
      
      writeFile(newFile, newText);
    }
  });
}


/**
 * adjust files which imported this file
 */
function adjustFilesWhichImportOldFile(oldFileName: string|undefined, newFileName: string) {
  return new Promise((resolve, reject) => {
    vscode.workspace.findFiles("src/**/*.ts", "**/node_modules/**").then((files) => {
      if(files && files.length > 0) {
        const promises: Thenable<boolean>[] = [];
        files.forEach((f) => {
          promises.push(vscode.workspace.fs.readFile(f).then((bytes) => {
            const txt = bytes.toString();
            const pattern = new RegExp(`(import[\\s\\w\\{\\}]+from\\s+".*/)${oldFileName}"`);
            
            if(txt.match(pattern)) {
              const newText = txt.replace(pattern,`$1${newFileName}"`);
              
              edit(f.fsPath).then(() => {
                writeFile(f,newText);
              });
            }
            return true;
          }));
        });
        
        Promise.all(promises).then(() => {
          resolve(true);
        }, (reason) => {
          reject(reason);
        });
      }
    });
  });
}


/**
 * adjust relative path imported in current component file
 * component will be put in to new component folder, so relative path should be adjusted.
 * @param newComponentUri 
 * @param oldComponentNameWithoutExt 
 * @param newComponentNameWithoutExt 
 */
function adjustPathInNewComponent(newComponentUri: vscode.Uri, oldComponentNameWithoutExt: string | undefined, newComponentNameWithoutExt: string | undefined) {
  vscode.workspace.fs.readFile(newComponentUri).then((bytes) => {
    const oldTxt = new TextDecoder().decode(bytes);
    let newText = oldTxt.replace(`${oldComponentNameWithoutExt}.html`,`${newComponentNameWithoutExt}.html`)
      .replace(/(import[^"]+")\.\.\/(.*")/g, "$1../../$2") // "../abc" -> "../../abc"
      .replace(/(import[^"]+")\.\/(.*")/g, "$1../$2"); // "./abc" -> "../abc"
      
    writeFile(newComponentUri, newText);
  });
}


function writeFile(f: vscode.Uri, newText: string) {
  const uint = new TextEncoder().encode(newText);
  
  vscode.workspace.fs.writeFile(f, uint).then(() => {
    console.log(`${f.fsPath} updated`);
  }, (reason) => {
    vscode.window.showErrorMessage(`Fail to update ${f.fsPath}`);
  });
}

