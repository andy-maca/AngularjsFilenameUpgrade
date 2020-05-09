import * as vscode from "vscode";

/**
 * Information of angularjs file
 */
export class Ng1FileInformation {
  dir: string | undefined;
  ext: string | undefined;
  ng1FileName: string | undefined;
  ng1FileNameWithoutExt: string | undefined;
  
  ng2FileName: string | undefined;
  ng2FileNameWithoutExt: string | undefined;
  
  //FirstSecondThird -> ["first", "second", "third"]
  unitNames: string[] | undefined = [];
  
  //last name of `unitNames`, e.g, "component","directive","service","pipe"
  type: string = "";
  
  private validTypes = ["module", "component","directive","service","pipe","filter"];
  
  constructor(public uri: vscode.Uri) {
    const paths = uri.fsPath.split("\\");
    
    if (paths.length > 0) {
      this.ng1FileName = paths.pop();
      this.dir = paths.join("\\");
      
      const splitNames = this.ng1FileName?.split(".");
      this.ext = splitNames?.pop();
      this.ng1FileNameWithoutExt = splitNames?.join(".");
      this.unitNames = this.ng1FileNameWithoutExt?.split(/(?<![A-Z])(?=[A-Z])/).map((s)=>s.toLocaleLowerCase());
      this.type = this.unitNames?this.unitNames[this.unitNames.length - 1] : "";
      
      if (this.validTypes.includes(this.type)) {
        this.ng2FileNameWithoutExt = this.unitNames?.slice(0, this.unitNames.length-1).join("-") + "." + this.type;
      } else {
        this.ng2FileNameWithoutExt = this.unitNames?.join("-");
      }
      this.ng2FileName = this.ng2FileNameWithoutExt + "." +this.ext;
    }
  }
}