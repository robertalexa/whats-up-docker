const { ValidationError } = require('joi');

jest.mock('pushover-notifications', () => (class Push {
    // eslint-disable-next-line class-methods-use-this
    send(message, cb) {
        cb(undefined, message);
    }
}));

const Pushover = require('./Pushover');

const pushover = new Pushover();

const configurationValid = {
    user: 'user',
    token: 'token',
    priority: 0,
    sound: 'pushover',
    threshold: 'all',
    mode: 'single',
    once: true,
    // eslint-disable-next-line no-template-curly-in-string
    simpletitle: 'New ${kind} found for container ${name}',
    // eslint-disable-next-line no-template-curly-in-string
    simplebody: 'Container ${name} running with ${kind} ${local} can be updated to ${kind} ${remote}\n${link}',
    // eslint-disable-next-line no-template-curly-in-string
    batchtitle: '${count} updates available',
};

test('validateConfiguration should return validated configuration when valid', () => {
    const validatedConfiguration = pushover.validateConfiguration(configurationValid);
    expect(validatedConfiguration).toStrictEqual(configurationValid);
});

test('validateConfiguration should apply_default_configuration', () => {
    const validatedConfiguration = pushover.validateConfiguration({
        user: configurationValid.user,
        token: configurationValid.token,
    });
    expect(validatedConfiguration).toStrictEqual(configurationValid);
});

test('validateConfiguration should throw error when invalid', () => {
    const configuration = {};
    expect(() => {
        pushover.validateConfiguration(configuration);
    }).toThrowError(ValidationError);
});

test('maskConfiguration should mask sensitive data', () => {
    pushover.configuration = configurationValid;
    expect(pushover.maskConfiguration()).toEqual({
        mode: 'single',
        priority: 0,
        // eslint-disable-next-line no-template-curly-in-string
        simplebody: 'Container ${name} running with ${kind} ${local} can be updated to ${kind} ${remote}\n${link}',
        // eslint-disable-next-line no-template-curly-in-string
        simpletitle: 'New ${kind} found for container ${name}',
        // eslint-disable-next-line no-template-curly-in-string
        batchtitle: '${count} updates available',
        sound: 'pushover',
        threshold: 'all',
        once: true,
        token: 't***n',
        user: 'u**r',
    });
});

test('trigger should send message to pushover', async () => {
    pushover.configuration = {
        ...configurationValid,
    };
    const container = {
        name: 'container1',
        image: {
            name: 'imageName',
            tag: {
                value: '1.0.0',
            },
            digest: {
                value: '123456789',
            },
        },
        result: {
            tag: '2.0.0',
        },
        updateKind: {
            kind: 'tag',
            localValue: '1.0.0',
            remoteValue: '2.0.0',
            semverDiff: 'major',
        },
    };
    const result = await pushover.trigger(container);
    expect(result).toStrictEqual({
        device: undefined,
        message: 'Container container1 running with tag 1.0.0 can be updated to tag 2.0.0\n',
        priority: 0,
        sound: 'pushover',
        title: 'New tag found for container container1',
    });
});
