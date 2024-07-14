import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { env } from '../env';
import { ClientError } from '../errors/client-erros';
import { dayjs } from '../lib/dayjs';
import { getEmailClient } from '../lib/mail';
import { prisma } from '../lib/prisma';

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invites',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params;
      const { email } = request.body;

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

      const participant = await prisma.participant.create({
        data: {
          email,
          trip_id: tripId,
        },
      });

      const formattedStartDate = dayjs(trip.starts_at).format('LL');
      const formattedEndDate = dayjs(trip.ends_at).format('LL');

      const mail = await getEmailClient();

      const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;

      const mailMessage = await mail.sendMail({
        from: {
          name: 'Equipe plann.er',
          address: 'noreply@plann.er',
        },
        to: participant.email,
        subject: `Confirme sua viagem para ${trip.destination} em ${formattedStartDate}`,
        html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
                <p>
                  Você foi convidado(a) para participar de uma viagem para <strong>${trip.destination}</strong>,
                  Brasil nas datas de <strong>${formattedStartDate} a ${formattedEndDate}</strong>.
                </p>
                <p></p>
                <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
                <p></p>
                <p>
                  <a href="${confirmationLink}"> Confirmar viagem </a>
                </p>
                <p></p>
                <p>Caso você não saiba do que se trata esse e-mail ou não poderá estar presente, apenas ignore esse e-mail.</p>
              </div>
            `.trim(),
      });

      console.log('Mail sent to:', nodemailer.getTestMessageUrl(mailMessage));

      return { participantId: participant.id };
    }
  );
}
