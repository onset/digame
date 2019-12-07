import { Folder } from "../../Folder";
import { File } from "../../file/File";
import * as Path from "path";
import knownFieldDefinitions from "../../field/KnownFieldDefinitions";
import * as fs from "fs-extra";
import { FolderMetadataFile } from "../../file/FolderMetaDataFile";
import { CustomFieldRegistry } from "../CustomFieldRegistry";
import { assertAttribute } from "../../../xmlUnitTestUtils";

export type idChangeHandler = (oldId: string, newId: string) => void;

export class Person extends Folder {
  // a callback on the Project that takes care of renaming any references to this person
  protected updateExternalReferencesToThisPerson: idChangeHandler;
  protected previousId: string;

  public ageOn(referenceDate: Date): string {
    return this.properties.getDateField("birthYear").ageOn(referenceDate);
  }

  // checks either the name or the code
  public referenceIdMatches(name: string): boolean {
    return name.toLowerCase() === this.getIdToUseForReferences().toLowerCase();
  }

  public get metadataFileExtensionWithDot(): string {
    return ".person";
  }

  private get mugshotFile(): File | undefined {
    return this.files.find(f => {
      return f.describedFilePath.indexOf("_Photo.") > -1;
    });
  }

  public get mugshotPath(): string {
    const m = this.mugshotFile;
    return m ? m.describedFilePath : "";
  }

  /* Used when the user gives us a mugshot, either the first one or replacement one */
  public set mugshotPath(path: string) {
    //console.log("photopath " + path);

    const f = this.mugshotFile;
    if (f) {
      fs.removeSync(f.describedFilePath);
      this.files.splice(this.files.indexOf(f), 1); //remove that one
    }

    const renamedPhotoPath = this.filePrefix + "_Photo" + Path.extname(path);

    this.addOneFile(path, renamedPhotoPath);
  }

  public get displayName(): string {
    return this.getIdToUseForReferences();
  }
  public getIdToUseForReferences(): string {
    const code = this.properties.getTextStringOrEmpty("code").trim();
    return code && code.length > 0
      ? code
      : this.properties.getTextStringOrEmpty("name");
  }

  public constructor(
    directory: string,
    metadataFile: File,
    files: File[],
    customFieldRegistry: CustomFieldRegistry,
    updateExternalReferencesToThisProjectComponent: idChangeHandler
  ) {
    super(directory, metadataFile, files, customFieldRegistry);
    this.properties.setText("name", Path.basename(directory));
    this.properties.addHasConsentProperty(this);
    this.properties.addDisplayNameProperty(this);
    this.safeFileNameBase = this.properties.getTextStringOrEmpty("name");
    this.properties.getValueOrThrow("name").textHolder.map.intercept(change => {
      // a problem with this is that it's going going get called for every keystroke

      return change;
    });
    this.knownFields = knownFieldDefinitions.person; // for csv export
    this.updateExternalReferencesToThisPerson = updateExternalReferencesToThisProjectComponent;
    this.previousId = this.getIdToUseForReferences();
  }
  public static fromDirectory(
    directory: string,
    customFieldRegistry: CustomFieldRegistry,
    updateExternalReferencesToThisProjectComponent: idChangeHandler
  ): Person {
    const metadataFile = new PersonMetadataFile(directory, customFieldRegistry);
    const files = this.loadChildFiles(
      directory,
      metadataFile,
      customFieldRegistry
    );
    return new Person(
      directory,
      metadataFile,
      files,
      customFieldRegistry,
      updateExternalReferencesToThisProjectComponent
    );
  }
  public static saveFolderMetaData() {
    //console.log("saving " + person.getString("title"));
    //fs.writeFileSync(person.path + ".test", JSON.stringify(person), "utf8");
  }

  // override
  protected textValueThatControlsFolderName(): string {
    return this.properties.getTextStringOrEmpty("name").trim();
  }

  // override
  public wouldCollideWithIdFields(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === this.textValueThatControlsFolderName() ||
      normalized === this.properties.getTextStringOrEmpty("code").toLowerCase()
    );
  }

  // A note about name vs. ID. Here "ID" may be the name or the code, since
  // the rule we inherited from SM Classic is that if a Person has something
  // in the "code" field, then that acts as the display name and id around
  // the whole system.
  public IdMightHaveChanged() {
    if (this.previousId !== this.getIdToUseForReferences()) {
      console.log(
        `Updating References ${
          this.previousId
        } --> ${this.getIdToUseForReferences()}`
      );

      // Let the project inform any sessions pointing at us to update their references
      if (this.updateExternalReferencesToThisPerson) {
        this.updateExternalReferencesToThisPerson(
          this.previousId,
          this.getIdToUseForReferences()
        );
      }
    }
    // save this for next time
    this.previousId = this.getIdToUseForReferences();
  }
}

export class PersonMetadataFile extends FolderMetadataFile {
  constructor(directory: string, customFieldRegistry: CustomFieldRegistry) {
    super(
      directory,
      "Person",
      true,
      ".person",
      knownFieldDefinitions.person,
      customFieldRegistry
    );
  }
}
