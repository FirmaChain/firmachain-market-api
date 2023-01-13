import { IsString } from "class-validator";

export class SUPPLY_DATE_DATA {
  @IsString()
  public lastUpdatedDate: string;
}