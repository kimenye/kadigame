require 'httparty'
require 'json'
require 'pry'

class ScoreService
  include HTTParty
  base_uri 'https://www.scoreoid.com/api/'

  def initialize(key, game_id)
    @options = {:api_key => key, :game_id => game_id, :response => "json" }
  end

  def get_user (username="test")
    opts = { :username => username }
    opts.merge!(@options)

    resp = self.class.post('/getPlayer', { :body => opts })
    result = JSON.parse(resp)

    if is_error(result)
      return nil
    else
      return result[0]["Player"]
    end
  end

  def get_users
    resp = self.class.post('/getPlayers', { :body => @options })
    result = JSON.parse(resp)

    if is_error(result)
      return nil
    else
      return result.collect { |p| p["Player"]}
    end
  end

  def create_user(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/createPlayer', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def delete_user(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/deletePlayer', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def create_score(username, points)
    opts = { :username => username, :score => points }
    opts.merge!(@options)
    resp = self.class.post('/createScore', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def calculate_score(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/getPlayerScores', { :body => opts})
    result = JSON.parse(resp)

    if !is_error(result)
      total = 0
      scores = result.map { |s| s['Score']['score'].to_i }
      scores.each { |s| total += s }
      return total
    end
  end

  def is_success(rsp)
    return !is_error(rsp) && rsp.has_key?('success')
  end

  def is_error(rsp)
    return !rsp.kind_of?(Array) && rsp.has_key?('error')
  end
end