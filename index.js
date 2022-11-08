const { GraphQLServer, PubSub, withFilter } = require('graphql-yoga')
const { nanoid } = require('nanoid');
const pubsub = require('./pubsub');
const { users, events, locations, participants } = require('./data.json');

const typeDefs = `
type User{
    id: ID!
    username: String!
    email: String!
    events: [Event!]!
}

input AddUserInput{
    username: String!
    email: String!
}

input UpdateUserInput{
    username: String
    email: String
}

type Event{
    id: ID!
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    location_id: String!
    user_id: String!
    user: User!
    location: Location!
    participants: [Participant!]!
}

input AddEventInput{
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    location_id: String!
    user_id: String!
}

input UpdateEventInput{
    title: String
    desc: String
    date: String
    from: String
    to: String
    location_id: String
    user_id: String
}

type Location{
    id: ID!
    name: String!
    desc: String!
    lat: String!
    lng: String!
}

input AddLocationInput{
    name: String!
    desc: String!
    lat: String!
    lng: String!
}

input UpdateLocationInput{
    name: String
    desc: String
    lat: String
    lng: String
    location_id: String
    user_id: String
}

type Participant{
    id: ID!
    user_id: String!
    event_id: String!
    user: User!
    event: Event!
}

input AddParticipantInput{
    user_id: String!
    event_id: String!
}

input UpdateParticipantInput{
    user_id: String
    event_id: String
}

type DeleteAllOutput {
    count:Int!
}

type Query {
    users: [User!]!
    user(id:ID!): User!

    events: [Event!]!
    event(id:ID!): Event!

    locations: [Location!]!
    location(id:ID!): Location!

    participants: [Participant!]!
    participant(id:ID!): Participant!
}

type Mutation {
    #User
    addUser(data:AddUserInput!): User!
    updateUser(id:ID!, data:UpdateUserInput!): User!
    deleteUser(id:ID!): User!
    deleteAllUsers: DeleteAllOutput!
    #Event
    addEvent(data:AddEventInput!): Event!
    updateEvent(id:ID!, data:UpdateEventInput!): Event!
    deleteEvent(id:ID!): Event!
    deleteAllEvents: DeleteAllOutput!
    #Location
    addLocation(data:AddLocationInput!): Location!
    updateLocation(id:ID!, data:UpdateLocationInput!): Location!
    deleteLocation(id:ID!): Location!
    deleteAllLocations: DeleteAllOutput!
    #Participant
    addParticipant(data:AddParticipantInput!): Participant!
    updateParticipant(id:ID!, data:UpdateParticipantInput!): Participant!
    deleteParticipant(id:ID!): Participant!
    deleteAllParticipants: DeleteAllOutput!
}

type Subscription {
    #User
    userCreated: User!

    #Event
    eventCreated: Event!

    #Participant
    participantAdded: Participant!
}
  `;

const resolvers = {
    Query: {
        users: () => users,
        user: (parent, args) => {
            const user = users.find(user => user.id == args.id);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        },
        events: () => events,
        event: (parent, args) => {
            const event = events.find(event => event.id == args.id);
            if (!event) {
                throw new Error('Event not found');
            }
            return event;
        },
        locations: () => locations,
        location: (parent, args) => {
            const location = locations.find(location => location.id == args.id);
            if (!location) {
                throw new Error('Location not found');
            }
            return location;
        },
        participants: () => participants,
        participant: (parent, args) => {
            const participant = participants.find(participant => participant.id == args.id);
            if (!participant) {
                throw new Error('Participant not found');
            }
            return participant;
        },
    },
    User: {
        events: (parent, args) => events.filter(event => event.user_id === parent.id),
    },
    Event: {
        user: (parent, args) => users.find(user => user.id === parent.user_id),
        location: (parent, args) => locations.find(location => location.id === parent.location_id),
        participants: (parent, args) => participants.filter(participant => participant.event_id === parent.id),
    },
    Participant: {
        user: (parent, args) => users.find(user => user.id === parent.user_id),
        event: (parent, args) => events.find(event => event.id === parent.event_id),
    },
    Mutation: {
        //User
        addUser: (parent, { data }) => {
            const user = { id: nanoid(), ...data };
            users.push(user);
            pubsub.publish('userCreated', { userCreated: user });
            return user;
        },
        updateUser: (parent, { id, data }) => {
            const user_index = users.findIndex(user => user.id == id);
            if (user_index === -1) {
                throw new Error('User not found');
            }
            const updated_user = (users[user_index] = { ...users[user_index], ...data });
            return updated_user;
        },
        deleteUser: (parent, { id }) => {
            const user_index = users.findIndex(user => user.id == id);
            if (user_index === -1) {
                throw new Error('User not found');
            }
            const deleted_user = users[user_index];
            users.splice(user_index, 1);
            return deleted_user;
        },
        deleteAllUsers: () => {
            const length = users.length;
            users.splice(0, length);
            return { count: length };
        },
        //Event
        addEvent: (parent, { data }) => {
            const event = { id: nanoid(), ...data };
            events.push(event);
            pubsub.publish('eventCreated', { eventCreated: event });
            return event;
        },
        updateEvent: (parent, { id, data }) => {
            const event_index = events.findIndex(event => event.id == id);
            if (event_index === -1) {
                throw new Error('Event not found');
            }
            const updated_event = (events[event_index] = { ...events[event_index], ...data });
            return updated_event;
        },
        deleteEvent: (parent, { id }) => {
            const event_index = events.findIndex(event => event.id == id);
            if (event_index === -1) {
                throw new Error('Event not found');
            }
            const deleted_event = events[event_index];
            events.splice(event_index, 1);
            return deleted_event;
        },
        deleteAllEvents: () => {
            const length = events.length;
            events.splice(0, length);
            return { count: length };
        },
        //Location
        addLocation: (parent, { data }) => {
            const location = { id: nanoid(), ...data };
            events.push(location);
            return location;
        },
        updateLocation: (parent, { id, data }) => {
            const location_index = locations.findIndex(location => location.id == id);
            if (location_index === -1) {
                throw new Error('Location not found');
            }
            const updated_location = (locations[location_index] = { ...locations[location_index], ...data });
            return updated_location;
        },
        deleteLocation: (parent, { id }) => {
            const location_index = locations.findIndex(location => location.id == id);
            if (location_index === -1) {
                throw new Error('Location not found');
            }
            const deleted_location = locations[location_index];
            locations.splice(location_index, 1);
            return deleted_location;
        },
        deleteAllLocations: () => {
            const length = locations.length;
            locations.splice(0, length);
            return { count: length };
        },
        //Participant
        addParticipant: (parent, { data }) => {
            const participant = { id: nanoid(), ...data };
            events.push(participant);
            pubsub.publish('participantAdded', { participantAdded: participant });
            return participant;
        },
        updateParticipant: (parent, { id, data }) => {
            const participant_index = participants.findIndex(participant => participant.id == id);
            if (participant_index === -1) {
                throw new Error('Participant not found');
            }
            const updated_participant = (participants[participant_index] = { ...participants[participant_index], ...data });
            return updated_participant;
        },
        deleteParticipant: (parent, { id }) => {
            const participant_index = participants.findIndex(participant => participant.id == id);
            if (participant_index === -1) {
                throw new Error('Participant not found');
            }
            const deleted_participant = participants[participant_index];
            participants.splice(participant_index, 1);
            return deleted_participant;
        },
        deleteAllParticipants: () => {
            const length = participants.length;
            participants.splice(0, length);
            return { count: length };
        },
    },
    Subscription: {
        //User
        userCreated: {
            subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator('userCreated')
        },
        //Event
        eventCreated: {
            subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator('eventCreated')
        },
        //Participant
        participantAdded: {
            subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator('participantAdded')
        },
    }
};

const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });

server.start(() => console.log('Server is running on localhost:4000'))