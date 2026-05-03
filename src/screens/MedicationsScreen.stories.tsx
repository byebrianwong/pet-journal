import type { Meta, StoryObj } from '@storybook/react';
import { MedicationsScreen } from './MedicationsScreen';
import { fixtureMedications } from '../../.storybook/fixtures';

const meta: Meta<typeof MedicationsScreen> = {
  title: 'Screens/MedicationsScreen',
  component: MedicationsScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    route: { params: { petId: 'pet-buddy' } },
    navigation: { navigate: () => {}, goBack: () => {} },
  } as any,
};
export default meta;

type Story = StoryObj<typeof MedicationsScreen>;

export const Empty: Story = {
  parameters: { mock: { medications: [] } },
};

export const WithMedications: Story = {
  parameters: { mock: { medications: fixtureMedications } },
};

export const ManyMedications: Story = {
  parameters: {
    mock: {
      medications: [
        ...fixtureMedications,
        {
          id: 'med-3',
          pet_id: 'pet-buddy',
          name: 'Cosequin',
          dosage: '1 chew',
          frequency: 'twice daily',
          time_of_day: '08:00',
          start_date: '2026-03-01',
          end_date: null,
          created_by: 'user-brian',
          created_at: '2026-03-01T00:00:00Z',
        },
        {
          id: 'med-4',
          pet_id: 'pet-buddy',
          name: 'Bravecto',
          dosage: '1000mg chew',
          frequency: 'every 3 months',
          time_of_day: null,
          start_date: '2026-01-01',
          end_date: null,
          created_by: 'user-brian',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    },
  },
};
