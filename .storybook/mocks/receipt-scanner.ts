export async function scanVetReceipt(_imageBase64: string) {
  return {
    success: true,
    data: {
      clinic_name: 'Maple Vet Clinic',
      vet_name: 'Smith',
      date: '2026-04-22',
      pet_name: 'Buddy',
      diagnoses: ['Healthy checkup'],
      medications_prescribed: ['Apoquel 16mg'],
      cost_total: 187.5,
    },
  };
}
