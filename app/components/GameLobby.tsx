import * as React from 'react';

import { Lobby } from 'components/Lobby';
import { IReactReduxProps } from 'types/redux';
import { IUsersState } from 'lobby/reducers/users';
import { server_addChat } from 'lobby/actions/chat';
import { netConnect, ILobbyNetState } from 'lobby';
import { getSessionName } from 'lobby/reducers/session';
import { VideoPlayer } from 'components/lobby/VideoPlayer';
import { IMediaItem, PlaybackState } from 'lobby/reducers/mediaPlayer';
import { isUrl } from 'utils/url';
import {
  server_requestMedia,
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek
} from 'lobby/actions/mediaPlayer';
import { IMessage } from 'lobby/reducers/chat';
import { Messages } from 'components/chat/Messages';
import { Chat } from 'components/chat';

import styles from './GameLobby.css';
import { UserItem } from 'components/lobby/UserItem';
import { MediaItem } from 'components/media/MediaItem';
import { Link } from 'react-router-dom';
import { getCurrentMedia, getMediaQueue } from 'lobby/reducers/mediaPlayer.helpers';
import { ListOverlay } from 'components/lobby/ListOverlay';
import { TitleBar } from 'components/lobby/TitleBar';
import { PlaybackControls } from 'components/media/PlaybackControls';
import { setVolume } from 'lobby/actions/settings';

interface IProps {
  host: boolean;
}

interface IConnectedProps {
  currentMedia?: IMediaItem;
  mediaQueue: IMediaItem[];
  messages: IMessage[];
  users: IUsersState;
  sessionName?: string;
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps;

const NO_MEDIA: IMediaItem = {
  title: 'No media playing',
  url: ''
};

class _GameLobby extends React.Component<PrivateProps> {
  private player: VideoPlayer | null;

  render(): JSX.Element {
    const { currentMedia: media } = this.props;
    //         <h3>{this.props.sessionName || 'Lobby'}</h3>
    //         <Link to="/servers">Leave</Link>
    const userIds = Object.keys(this.props.users);
    return (
      <div className={styles.container}>
        <VideoPlayer
          theRef={el => {
            this.player = el;
          }}
          className={styles.video}
        />
        {this.renderPlaybackControls()}
        <TitleBar className={styles.titlebar} title={media && media.title} />
        <ListOverlay className={styles.users} title="Users" tagline={`${userIds.length} online`}>
          {userIds.map((userId: string) => {
            const user = this.props.users[userId]!;
            return <UserItem key={userId} user={user} />;
          })}
        </ListOverlay>
        <ListOverlay
          className={styles.queue}
          title="Next up"
          tagline={`${this.props.mediaQueue.length} items`}
        >
          {this.props.mediaQueue.map((media, idx) => {
            return <MediaItem key={idx} media={media} />;
          })}
        </ListOverlay>
        <Chat className={styles.chat} messages={this.props.messages} sendMessage={this.sendChat} />
      </div>
    );
  }

  private renderPlaybackControls(): JSX.Element {
    return (
      <PlaybackControls
        reload={() => {
          console.log('reload', this, this.player);
          if (this.player) {
            this.player.reload();
          }
        }}
        debug={() => {
          if (this.player) {
            this.player.debug();
          }
        }}
      />
    );
  }

  private sendChat = (text: string): void => {
    if (isUrl(text)) {
      this.props.dispatch(server_requestMedia(text));
    } else {
      this.props.dispatch(server_addChat(text));
    }
  };
}

export const GameLobby = netConnect<{}, {}, IProps>((state: ILobbyNetState): IConnectedProps => {
  return {
    currentMedia: getCurrentMedia(state),
    mediaQueue: getMediaQueue(state),
    messages: state.chat.messages,
    users: state.users,
    sessionName: getSessionName(state)
  };
})(_GameLobby);
