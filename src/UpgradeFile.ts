import * as vscode from 'vscode';
import { upgradeComponentFile } from './UpgradeComponentFile';

export function upgradeFile(uri: vscode.Uri) {
  if(uri.fsPath.match(/.*Component\.ts/)) {
    upgradeComponentFile(uri);
  } else {
    vscode.window.showWarningMessage("Not valid angular file name");
  }
}