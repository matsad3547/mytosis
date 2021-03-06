import isPromise from 'is-promise';

/**
 * Triggers an asynchronous hook pipeline. Each hook can change
 * the input to the next via the `transform` callback.
 * @param  {Object} pipeline - Describes what hooks to call and how.
 * @param  {Array} pipeline.hooks - A list of functions to call.
 * @param  {Array} pipeline.args - The initial arguments to start with.
 * @return {Promise} - Resolves to the final arguments output.
 */
export default async function ({
  hooks,
  args,
  transform,
}) {
  for (const hook of hooks) {
    let output = this::hook(...args);

    if (isPromise(output)) {
      output = await output;
    }

    args = transform(output, args);
  }

  return args;
};
