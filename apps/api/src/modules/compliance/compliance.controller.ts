import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/jwt-payload.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BaaComplianceService } from './baa-compliance.service.js';
import { BaaMedicalComplianceGuard } from './baa-medical-compliance.guard.js';
import { BidService } from './bid.service.js';
import { AcceptBaaDto, SubmitBidDto } from './dto.js';

@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly complianceService: BaaComplianceService,
    private readonly bidService: BidService,
  ) {}

  // What a signer must be shown before "Accept BAA" means anything -- the
  // version here is always the one recordAcceptance will actually record.
  @Get('baa/terms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'CUSTOMER')
  getCurrentTerms() {
    return this.complianceService.getCurrentTerms();
  }

  // The facility itself accepts its own BAA — dto.accountId scopes this to
  // that one account, so a CUSTOMER can never accept on another account's
  // behalf. acceptedBy comes from the authenticated caller, never the request
  // body — a legal acceptance record can't be trusted if the signer's
  // identity is just a free-text field anyone could fill in.
  @Post('baa/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'CUSTOMER')
  accept(@Body() dto: AcceptBaaDto, @CurrentUser() user: JwtPayload) {
    return this.complianceService.recordAcceptance({
      accountId: dto.accountId,
      acceptedBy: user.email,
    });
  }

  // A vendor bidding on work at one account — same accountId scoping.
  // vendorId comes from the authenticated caller, never the request body, so
  // a vendor can't submit a bid attributed to someone else.
  @Post('bids')
  @UseGuards(JwtAuthGuard, RolesGuard, BaaMedicalComplianceGuard)
  @Roles('ADMIN', 'OPERATOR', 'VENDOR')
  submitBid(@Body() dto: SubmitBidDto, @CurrentUser() user: JwtPayload) {
    return this.bidService.submitBid({
      accountId: dto.accountId,
      vendorId: user.sub,
      amountCents: dto.amountCents,
      description: dto.description,
    });
  }

  // Staff retrieval of the bids submitted on an account — the piece that
  // was entirely missing before this fix.
  @Get('bids/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  listBids(@Param('accountId') accountId: string) {
    return this.bidService.listBidsForAccount(accountId);
  }
}
