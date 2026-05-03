export async function createInvite(_petId: string): Promise<string> {
  return 'petjournal://invite/MOCK1234';
}

export async function acceptInvite(_code: string): Promise<boolean> {
  return true;
}

export async function getShareLink(_petId: string): Promise<string> {
  return 'petjournal://invite/MOCK1234';
}
