import Decimal from "break_infinity.js";

export type RoundSettingsData = {
  basePointsForPromote: Decimal;
  minimumPeopleForPromote: number;
  baseVinegarNeededToThrow: Decimal;
  baseGrapesNeededToAutoPromote: Decimal;
  manualPromoteWaitTime: number;
};

export class RoundSettings implements RoundSettingsData {
  basePointsForPromote: Decimal = new Decimal(1000);
  minimumPeopleForPromote: number = 10;
  baseVinegarNeededToThrow: Decimal = new Decimal(1000);
  baseGrapesNeededToAutoPromote: Decimal = new Decimal(1000);
  manualPromoteWaitTime: number = 30;

  constructor(data: any) {
    Object.assign(this, data);
    this.basePointsForPromote = Object.freeze(
      new Decimal(this.basePointsForPromote)
    );
    this.baseVinegarNeededToThrow = Object.freeze(
      new Decimal(this.baseVinegarNeededToThrow)
    );
    this.baseGrapesNeededToAutoPromote = Object.freeze(
      new Decimal(this.baseGrapesNeededToAutoPromote)
    );
  }
}
