import cors from '@fastify/cors';
import fastity from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { confirmParticipant } from './routes/confirm-participant';
import { confirmTrip } from './routes/confirm-trip';
import { createTrip } from './routes/create-trip';

const app = fastity();

app.register(cors, {
  origin: '*',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createTrip);
app.register(confirmTrip);
app.register(confirmParticipant);

app.get('/', () => {
  return { message: 'Hello World' };
});

app
  .listen({
    port: 3444,
  })
  .then(() => {
    console.log('🚀 Server running on port:', 3444);
  });
