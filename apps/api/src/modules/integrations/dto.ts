import { IsArray, IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntegrationCategory } from '@repo/database';

export class ListProvidersQueryDto {
  @IsOptional()
  @IsIn(Object.values(IntegrationCategory))
  category?: IntegrationCategory;
}

export class ListConnectionsQueryDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

export class CreateConnectionDto {
  /** Every connection created from here on must declare its owning account
   *  -- see the schema comment on IntegrationConnection.accountId. */
  @IsUUID()
  accountId!: string;

  @IsUUID()
  providerId!: string;

  @IsString()
  label!: string;

  @IsArray()
  @IsString({ each: true })
  scopes!: string[];

  /** The raw secret (API key, OAuth token). Sealed before it ever reaches the database. */
  @IsString()
  credential!: string;
}

export class DispatchConnectionDto {
  @IsString()
  operation!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
