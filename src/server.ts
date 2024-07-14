import cors from '@fastify/cors';
import fastity from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { env } from './env';
import { errorHandler } from './error-handler';
import { confirmParticipant } from './routes/confirm-participant';
import { confirmTrip } from './routes/confirm-trip';
import { createActivity } from './routes/create-activity';
import { createInvite } from './routes/create-invite';
import { createLink } from './routes/create-link';
import { createTrip } from './routes/create-trip';
import { getActivities } from './routes/get-activities';
import { getLinks } from './routes/get-links';
import { getParticipant } from './routes/get-participant';
import { getParticipants } from './routes/get-participants';
import { getTripDetails } from './routes/get-trip-details';
import { updateTrip } from './routes/update-trip';

const app = fastity();

app.register(cors, {
  origin: '*',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler);

app.register(createTrip);
app.register(confirmTrip);
app.register(confirmParticipant);
app.register(createActivity);
app.register(getActivities);
app.register(createLink);
app.register(getLinks);
app.register(getParticipants);
app.register(createInvite);
app.register(updateTrip);
app.register(getTripDetails);
app.register(getParticipant);

app.get('/', () => {
  return { message: 'Hello World' };
});

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('🚀 Server running on port:', env.PORT);
  });
