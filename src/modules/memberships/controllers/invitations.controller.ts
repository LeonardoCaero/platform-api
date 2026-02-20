import type { Request, Response } from 'express';
import { MembershipsService } from '../services/memberships.service';

const membershipsService = new MembershipsService();

export class InvitationsController {
  async getPending(req: Request, res: Response) {
    const userId = req.user!.userId;
    const invitations = await membershipsService.getPendingInvitations(userId);
    res.json(invitations);
  }

  async accept(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { membershipId } = req.params;
    await membershipsService.acceptInvitation(userId, membershipId);
    res.status(200).json({ success: true });
  }

  async decline(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { membershipId } = req.params;
    await membershipsService.declineInvitation(userId, membershipId);
    res.status(200).json({ success: true });
  }
}
