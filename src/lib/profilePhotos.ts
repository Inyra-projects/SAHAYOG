export const PROFILE_PHOTOS: Record<string, string> = {
  "u-sheetal":
    "https://images.unsplash.com/photo-1573497019707-1c04de26e58c?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-sandeep":
    "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-priya":
    "https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-rohit":
    "https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-sneha":
    "https://images.unsplash.com/photo-1739785248579-cd43cdaac06b?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-amit":
    "https://images.unsplash.com/photo-1600878459138-e1123b37cb30?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-meera":
    "https://images.unsplash.com/photo-1726156619056-5de67024df67?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-nikhil":
    "https://images.unsplash.com/photo-1793507660925-fc694e67de1f?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
  "u-anjali":
    "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?auto=format&fit=crop&crop=faces&w=160&h=160&q=80",
};

export function getProfilePhoto(userId: string) {
  return PROFILE_PHOTOS[userId];
}
