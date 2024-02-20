import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { integrationKeys } from './keys'

type UpdateVariables = {
  connectionId: string | number
  organizationId: number
  cwdPath: string
}

export async function updateConnection(
  { connectionId, cwdPath }: UpdateVariables,
  signal?: AbortSignal
) {
  const { data, error } = await patch('/platform/integrations/github/connections/{connection_id}', {
    params: { path: { connection_id: String(connectionId) } },
    signal,
    body: { cwd_path: cwdPath },
  })
  if (error) throw error

  return data
}

type UpdateContentData = Awaited<ReturnType<typeof updateConnection>>

export const useGitHubConnectionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateContentData, ResponseError, UpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateContentData, ResponseError, UpdateVariables>(
    (args) => updateConnection(args),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(
            integrationKeys.githubConnectionsList(variables.organizationId)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update Github connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
