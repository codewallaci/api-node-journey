import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import nodemailer from 'nodemailer';
import { string, z } from 'zod';
import { getEmailClient } from '../lib/mail';
import { prisma } from '../lib/prisma';

import { dayjs } from '../lib/dayjs';

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/create',
    {
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: string(),
          owner_email: string().email(),
          emails_to_invite: z.array(z.string().email()),
        }),
      },
    },
    async (
      request
    ): Promise<{
      tripId: string;
      nodemailerUrl: string | false;
    }> => {
      const {
        destination,
        starts_at,
        ends_at,
        owner_email,
        owner_name,
        emails_to_invite,
      } = request.body;

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new Error('Start date must be in the future');
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new Error('End date must be after start date');
      }

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  name: owner_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true,
                },
                ...emails_to_invite.map((email) => {
                  return {
                    email,
                    is_owner: false,
                    is_confirmed: false,
                  };
                }),
              ],
            },
          },
        },
      });

      const formattedStartDate = dayjs(starts_at).format('LL');
      const formattedEndDate = dayjs(ends_at).format('LL');

      const confirmationLink = `http://localhost:3444/trips/${trip.id}/confirm`;

      const mail = await getEmailClient();

      const mailMessage = await mail.sendMail({
        from: {
          name: 'Equipe plann.er',
          address: 'noreply@plann.er',
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
        html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
            <p>
              Você solicitou a criação de uma viagem para <strong>${destination}</strong>,
              Brasil nas datas de <strong>${formattedStartDate} a ${formattedEndDate}</strong>.
            </p>
            <p></p>
            <p>Para confirmar sua viagem, clique no link abaixo:</p>
            <p></p>
            <p>
              <a href="${confirmationLink}"> Confirmar viagem </a>
            </p>
            <p></p>
            <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
          </div>
        `.trim(),
      });

      const nodemailerUrl = nodemailer.getTestMessageUrl(mailMessage);

      return {
        tripId: trip.id,
        nodemailerUrl,
      };
    }
  );
}
