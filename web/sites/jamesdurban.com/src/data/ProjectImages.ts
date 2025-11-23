import atomicImg from "../assets/atomic.jpg";
import pandaImg from "../assets/panda.png";
import pushNotificationsImg from "../assets/push-notifications.jpg";
import type {ImageMetadata} from "astro";

export const projectImages: Record<string, ImageMetadata> = {
  atomic: atomicImg,
  panda: pandaImg,
  "push-notifications": pushNotificationsImg,
};
