import 'reflect-metadata';

describe('main.ts', () => {
  it('should call bootstrap function', async () => {
    // Mock the bootstrap function
    const mockBootstrap = jest.fn().mockResolvedValue(undefined);
    jest.doMock('./bootstrap-app', () => ({
      bootstrap: mockBootstrap,
    }));

    // Import main.ts which should call bootstrap
    await import('./main');

    // Give a moment for the async call
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockBootstrap).toHaveBeenCalled();
  });
});
