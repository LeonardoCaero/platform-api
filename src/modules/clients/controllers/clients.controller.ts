import type { Request, Response } from 'express';
import { ClientsService } from '../services/clients.service';
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
  createClientSiteSchema,
  updateClientSiteSchema,
  createClientRateRuleSchema,
  updateClientRateRuleSchema,
  createClientRateRuleResourceSchema,
  updateClientRateRuleResourceSchema,
} from '../schemas/clients.schema';

const clientsService = new ClientsService();

export class ClientsController {
  // Clients

  /** Create a new client. */
  async create(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = createClientSchema.parse(req.body);
    const client = await clientsService.create(data, userId, isPlatformAdmin);
    res.status(201).json({ success: true, data: client });
  }

  /** List clients for a company. */
  async list(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const query = listClientsQuerySchema.parse(req.query);
    const result = await clientsService.list(query, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: result.clients, pagination: result.pagination });
  }

  /** Get a client by ID. */
  async getById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const client = await clientsService.getById(req.params.id, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: client });
  }

  /** Update a client. */
  async update(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateClientSchema.parse(req.body);
    const client = await clientsService.update(req.params.id, data, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: client });
  }

  /** Delete a client. */
  async delete(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const result = await clientsService.delete(req.params.id, userId, isPlatformAdmin);
    res.status(200).json({ success: true, ...result });
  }

  // Sites

  /** Create a site under a client. */
  async createSite(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = createClientSiteSchema.parse(req.body);
    const site = await clientsService.createSite(req.params.clientId, data, userId, isPlatformAdmin);
    res.status(201).json({ success: true, data: site });
  }

  /** Update a site. */
  async updateSite(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateClientSiteSchema.parse(req.body);
    const site = await clientsService.updateSite(req.params.siteId, data, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: site });
  }

  /** Delete a site. */
  async deleteSite(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const result = await clientsService.deleteSite(req.params.siteId, userId, isPlatformAdmin);
    res.status(200).json({ success: true, ...result });
  }

  // Rate Rules

  /** Create a rate rule under a client. */
  async createRateRule(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = createClientRateRuleSchema.parse(req.body);
    const rule = await clientsService.createRateRule(req.params.clientId, data, userId, isPlatformAdmin);
    res.status(201).json({ success: true, data: rule });
  }

  /** Update a rate rule. */
  async updateRateRule(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateClientRateRuleSchema.parse(req.body);
    const rule = await clientsService.updateRateRule(req.params.ruleId, data, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: rule });
  }

  /** Delete a rate rule. */
  async deleteRateRule(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const result = await clientsService.deleteRateRule(req.params.ruleId, userId, isPlatformAdmin);
    res.status(200).json({ success: true, ...result });
  }

  // Resources

  /** Create a resource under a rate rule. */
  async createResource(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = createClientRateRuleResourceSchema.parse(req.body);
    const resource = await clientsService.createResource(req.params.ruleId, data, userId, isPlatformAdmin);
    res.status(201).json({ success: true, data: resource });
  }

  /** Update a rate rule resource. */
  async updateResource(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const data = updateClientRateRuleResourceSchema.parse(req.body);
    const resource = await clientsService.updateResource(req.params.resourceId, data, userId, isPlatformAdmin);
    res.status(200).json({ success: true, data: resource });
  }

  /** Delete a rate rule resource. */
  async deleteResource(req: Request, res: Response) {
    const userId = req.user!.userId;
    const isPlatformAdmin = req.isPlatformAdmin || false;
    const result = await clientsService.deleteResource(req.params.resourceId, userId, isPlatformAdmin);
    res.status(200).json({ success: true, ...result });
  }
}
