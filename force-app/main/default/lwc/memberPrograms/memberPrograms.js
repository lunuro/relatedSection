import { LightningElement, wire, api } from "lwc";

//Method used to get related records
import { getRelatedListRecords } from "lightning/uiRelatedListApi";
//Method used to update records
import { updateRecord } from "lightning/uiRecordApi";
//Method used to show toast
import { ShowToastEvent } from "lightning/platformShowToastEvent";

//Schema imports
import PROGRAM_OBJECT from "@salesforce/schema/Program__c";
import NAME_FIELD from "@salesforce/schema/Program__c.Name";
import STATUS_FIELD from "@salesforce/schema/Program__c.Status__c";
import ID_FIELD from "@salesforce/schema/Program__c.Id";

export default class MemberPrograms extends LightningElement {
  @api recordId;
  objectApiName = PROGRAM_OBJECT;
  progFields = { NAME_FIELD, STATUS_FIELD };
  error;
  records;
  editMode = false;
  iconToggle = "utility:switch";

  /**
   * @description Method to obtain related member programs
   * @author lunuro
   * @date 16/11/2022
   * @param {*} { error, data }
   * @memberof MemberPrograms
   */
  @wire(getRelatedListRecords, {
    parentRecordId: "$recordId",
    relatedListId: "Programs__r",
    fields: ["Program__c.Name", "Program__c.Status__c"]
  })
  listInfo({ error, data }) {
    if (data) {
      this.records = data.records;
    } else if (error) {
      this.generateToast(
        "Error while getting program records",
        error.message,
        "error"
      );
    }
  }

  /**
   * @description Method to open or close program section
   * @author lunuro
   * @date 16/11/2022
   * @memberof MemberPrograms
   */
  toggleSection() {
    let progSection = this.template.querySelector(".progSection").classList;
    if (progSection.contains("slds-is-open")) {
      progSection.remove("slds-is-open");
      this.iconToggle = "utility:chevronright";
    } else {
      progSection.add("slds-is-open");
      this.iconToggle = "utility:switch";
    }
  }

  /**
   * @description Method to modify edit mode after clicking on edit icon
   * @author lunuro
   * @date 16/11/2022
   * @memberof MemberPrograms
   */
  handleEdit() {
    this.editMode = true;
  }

  /**
   * @description Method to update program records
   * @author lunuro
   * @date 16/11/2022
   * @memberof MemberPrograms
   */
  async handleSave() {
    let recordsUpd = [];
    for (const rec of this.records) {
      const fields = {};
      fields[ID_FIELD.fieldApiName] = rec.id;
      fields[STATUS_FIELD.fieldApiName] = this.template.querySelector(
        "." + rec.id
      ).value;
      const recUpd = { fields };
      //Only update modified records
      if (
        rec.fields[STATUS_FIELD.fieldApiName].value !==
        recUpd.fields[STATUS_FIELD.fieldApiName]
      ) {
        recordsUpd.push(recUpd);
      }
    }

    //Close edit mode and skip updating if no records were modified
    if (recordsUpd.length === 0) {
      this.editMode = false;
      return;
    }

    // Update all records in parallel
    const recordUpdatePromises = recordsUpd.map((record) =>
      updateRecord(record)
    );
    await Promise.all(recordUpdatePromises)
      .then(() => {
        this.editMode = false;
      })
      .catch((error) => {
        this.generateToast(
          "Error while updating program records",
          error.message,
          "error"
        );
      });
  }

  /**
   * @description Method to handle edit cancel
   * @author lunuro
   * @date 16/11/2022
   * @memberof MemberPrograms
   */
  handleCancel() {
    //Reset input values
    const inputFields = this.template.querySelectorAll("lightning-input-field");
    if (inputFields) {
      inputFields.forEach((field) => {
        field.reset();
      });
    }
    this.editMode = false;
  }

  /**
   * @description Method to generate toast
   * @author lunuro
   * @date 16/11/2022
   * @param {*} title
   * @param {*} message
   * @param {*} variant
   * @memberof MemberPrograms
   */
  generateToast(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }
}