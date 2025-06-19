import React from 'react'
import type { GetServerSidePropsContext } from 'next'

import { createClient } from '@/util/supabase/server-props'

const PrivatePage = () => {
  return <div>Private page (auth logic not implemented)</div>
}

export default PrivatePage

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context)

  // Implement new private page logic here.

  return {
    props: {},
  }
}