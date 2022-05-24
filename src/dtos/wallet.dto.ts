import { IsNumber, IsString } from "class-validator";

export class WALLET_AMOUNT {
  @IsString()
  public address: string;

  @IsNumber()
  public amount: number;
}