import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

import { ClientError } from '../errors/client-erros';
import { dayjs } from '../lib/dayjs';

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/trips/:tripId',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params;
      const { destination, starts_at, ends_at } = request.body;

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new ClientError('Start date must be in the future');
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new ClientError('End date must be after start date');
      }

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) {
        throw new ClientError('Trip not found');
      }
      if (!trip.is_confirmed) {
        throw new ClientError('Trip owner has not confirmed the trip');
      }

      const tripUpdated = await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          destination,
          starts_at,
          ends_at,
        },
      });

      return {
        message: 'Trip updated',
        trip: tripUpdated,
      };
    }
  );
}
