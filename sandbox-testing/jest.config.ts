import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js']
};

export default config;
