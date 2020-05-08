import * as vscode from "vscode";
import { spawn, exec } from "child_process";



async function check_login_status(){
  const promise = new Promise((resolve, reject) => {
      const child = spawn('p4',['login','-s']);
      child.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
          resolve(true);
      });

      child.stderr.on('data', (data) => {
          reject(data);
      });
  });
  return promise;
}

export function move(oldPath: string, newPath: string, openAfterMove: boolean = true) {
  check_login_status().then(() => {
    edit(oldPath).then((success:boolean) => {
      if (success) {
        exec(`p4 move ${oldPath} ${newPath}`, (error, stdout, stderr) => {
          if (!error && !stderr) {
            console.log(stdout);
            
            if(openAfterMove) {
              vscode.window.showTextDocument(vscode.Uri.file(newPath)).then(() => {
                console.log(`Document opened: ${newPath}`);
              }, (reason) => {
                vscode.window.showErrorMessage(reason);
              });
            }
          } else {
            vscode.window.showErrorMessage(`Perforce error, ${stderr}`);
          }
        });
      }
    });
  }, (reason) => {
    vscode.window.showErrorMessage(`Perforce error, ${reason}`);
  });
}


export async function edit(path: string): Promise<boolean> {
  const promise = new Promise<boolean>((resolve, reject) => {
    const child = spawn('p4',['edit',path]);
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      resolve(true);
    });

    child.stderr.on('data', (data) => {
      console.error(data);
      vscode.window.showErrorMessage(`Perforce error, ${data}`);
      resolve(false);
    });
  });
  return promise;
}