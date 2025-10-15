import test from 'ava'

test('cluster mock / should support end method', async t => {
  const cluster = {
    geocode() {
      return []
    },
    reverse() {
      return []
    },
    end() {
      return Promise.resolve()
    }
  }

  t.is(typeof cluster.end, 'function')
  await t.notThrowsAsync(async () => {
    await cluster.end()
  })
})

test('cluster mock / end should be callable when cluster is terminated', async t => {
  let terminated = false

  const cluster = {
    geocode() {
      if (terminated) {
        throw new Error('Cluster terminated')
      }

      return []
    },
    end() {
      terminated = true
      return Promise.resolve()
    }
  }

  await cluster.end()
  t.true(terminated)

  await t.throwsAsync(
    async () => cluster.geocode({}),
    {message: 'Cluster terminated'}
  )
})
