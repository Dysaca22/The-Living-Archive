import { Movie, ViewingStatus } from '../../../types/movie';

export interface HomeSectionCardHandlers {
  onInfo: (movie: Movie) => void;
  onSave: (movie: Movie) => Promise<void>;
  isSaved: (movie: Movie) => boolean;
  getStatus: (movie: Movie) => ViewingStatus | undefined;
}
