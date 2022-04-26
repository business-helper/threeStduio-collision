export interface ModelControl {
  show_model?: boolean | null;
  show_skt?: boolean | null;
  activate_all?: boolean | null;
  continue_model?: boolean | null;
  single_step?: {
    enabled?: boolean | null;
    event?: boolean | null;
    size_of_next?: number | null;
  };
}
